import { Flagpole } from "./index";
import { Suite } from "./suite";
import { iLogLine, SubheadingLine, CommentLine, PassLine, FailLine, ConsoleColor } from "./consoleline";
import { JsonResponse } from "./jsonresponse";
import { HtmlResponse } from "./htmlresponse";
import { ResponseType, SimplifiedResponse } from "./response";
import { ImageResponse } from "./imageresponse";
import { ResourceResponse } from "./resourceresponse";
import { ScriptResponse } from "./scriptresponse";
import { CssResponse } from "./cssresponse";
import { Mock } from "./mock";

let request = require('request');

/**
 * A scenario contains tests that run against one request
 */
export class Scenario {

    public readonly suite: Suite;

    protected title: string;
    protected log: Array<iLogLine> = [];
    protected failures: Array<string> = [];
    protected passes: Array<string> = [];
    protected onDone: Function;
    protected initialized: number | null = null;
    protected start: number | null = null;
    protected end: number | null = null;
    protected requestStart: number | null = null;
    protected requestLoaded: number | null = null;
    protected responseType: ResponseType = ResponseType.html;
    protected url: string | null = null;
    protected waitToExecute: boolean = false;
    protected nextLabel: string | null = null;
    protected flipAssertion: boolean = false;
    protected optionalAssertion: boolean = false;
    protected ignoreAssertion: boolean = false;

    protected _then: Function | null = null;
    protected _isMock: boolean = false;

    protected options: any = {
        method: 'GET',
        headers: {}
    };

    constructor(suite: Suite, title: string, onDone: Function) {
        this.initialized = Date.now();
        this.suite = suite;
        this.title = title;
        this.onDone = onDone;
        this.subheading(title);
    }

    /**
     * Did any assertions in this scenario fail?
     *
     * @returns {boolean}
     */
    public failed(): boolean {
        return (this.failures.length > 0);
    }

    /**
     * Did all assertions in this scenario pass? This also requires that the scenario has completed
     *
     * @returns {boolean}
     */
    public passed(): boolean {
        return !!(this.end && this.failures.length == 0);
    }

    /**
     * Set body to submit
     * 
     * @param jsonObject 
     * @returns {Scenario}
     */
    public jsonBody(jsonObject: any): Scenario {
        this.header('Content-Type', 'application/json');
        return this.body(JSON.stringify(jsonObject));
    }

    /**
     * 
     * @param str 
     */
    public body(str: string): Scenario {
        this.options.body = str;
        return this;
    }

    /**
     * Make sure the web page has valid SSL certificate
     * 
     * @param verify 
     */
    public verifySslCert(verify: boolean): Scenario {
        this.options.strictSSL = verify;
        this.options.rejectUnauthorized = verify;
        return this;
    }

    /**
     * 
     * @param proxyUri 
     */
    public proxy(proxyUri: string): Scenario {
        this.options.proxy = proxyUri;
        return this;
    }

    /**
     * Set the timeout for how long the request should wait for a response
     *
     * @param {number} timeout
     * @returns {Scenario}
     */
    public timeout(timeout: number): Scenario {
        this.options.timeout = timeout;
        return this;
    }

    /**
     * Do not run this scenario until execute() is called
     *
     * @param {boolean} bool
     * @returns {Scenario}
     */
    public wait(bool: boolean = true): Scenario {
        this.waitToExecute = bool;
        return this;
    }

    /**
     * Set the form options that will be submitted with the request
     *
     * @param form
     * @returns {Scenario}
     */
    public form(form: {}): Scenario {
        this.options.form = form;
        return this;
    }

    /**
     * 
     * @param n 
     */
    public maxRedirects(n: number): Scenario {
        this.options.maxRedirects = n;
        return this;
    }

    /**
     * 
     * @param onRedirect 
     */
    public followRedirect(onRedirect: boolean | Function): Scenario {
        this.options.followRedirect = onRedirect;
        return this;
    }

    /**
     * Set the basic authentication headers to be sent with this request
     *
     * @param authorization
     * @returns {Scenario}
     */
    public auth(authorization: { username: string, password: string }): Scenario {
        this.options.auth = authorization;
        return this;
    }

    /**
     * Set the full list of headers to submit with this request
     *
     * @param headers
     * @returns {Scenario}
     */
    public headers(headers: {}): Scenario {
        this.options.headers = Object.assign(this.options.headers, headers);
        return this;
    }

    /**
     * Set a single header key-value without overriding others
     *
     * @param {string} key
     * @param value
     * @returns {Scenario}
     */
    public header(key: string, value: any): Scenario {
        this.options.headers = this.options.headers || {};
        this.options.headers[key] = value;
        return this;
    }

    /**
     * Set the HTTP method of this request
     *
     * @param {string} method
     * @returns {Scenario}
     */
    public method(method: string): Scenario {
        this.options.method = method.toUpperCase();
        return this;
    }

    /**
     * Has this scenario completed?
     *
     * @returns {boolean}
     */
    public isDone(): boolean {
        return (this.end !== null);
    }

    /**
     * Add a subheading log message to buffer
     */
    public subheading(message: string): Scenario {
        this.log.push(new SubheadingLine(message));
        return this;
    }

    /**
     * Add a neutral line to the output
     */
    public comment(message: string): Scenario {
        this.log.push(
            new CommentLine(message)
        );
        //this.passes.push(message);
        return this;
    }

    /**
     * Assert something is true, with respect to the flipped not()
     * Also respect ignore assertions flag
     */
    public assert(statement: boolean, message: string, actualValue?: string): Scenario {
        if (!this.ignoreAssertion) {
            let passed: boolean = this.flipAssertion ? !statement : !!statement;
            if (this.flipAssertion) {
                message = 'NOT: ' + message;
            }
            if (this.optionalAssertion) {
                message += ' - Optional';
            }
            if (passed) {
                this.pass(message);
            }
            else {
                if (actualValue) {
                    message += ' (' + actualValue + ')';
                }
                this.fail(message, this.optionalAssertion);
            }
            return this.reset();
        }
        return this;
    }

    /**
     * Push in a new passing assertion
     */
    public pass(message: string): Scenario {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(new PassLine(message));
        this.passes.push(message);
        return this;
    }

    /**
     * Push in a new failing assertion
     */
    public fail(message: string, isOptional: boolean = false): Scenario {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        let line: FailLine = new FailLine(message);
        if (isOptional) {
            line.color = ConsoleColor.FgMagenta;
            line.textSuffix = '(Optional)';
        }
        this.log.push(line);
        if (!isOptional) {
            this.failures.push(message);
        }
        return this;
    }

    /**
     * Clear out any previous settings
     */
    protected reset(): Scenario {
        this.flipAssertion = false;
        this.optionalAssertion = false;
        return this;
    }

    /**
     * Flip the next assertion
     */
    public not(): Scenario {
        this.flipAssertion = true;
        return this;
    }

    /**
    * Consider the next set of tests optional, until the next selector
    */
    public optional(): Scenario {
        this.optionalAssertion = true;
        return this;
    }

    /**
     * Ignore assertions until further notice
     */
    public ignore(assertions: boolean | Function = true): Scenario {
        if (typeof assertions == 'boolean') {
            this.ignoreAssertion = assertions;
        }
        else if (typeof assertions == 'function') {
            this.ignore(true);
            assertions();
            this.ignore(false);
        }
        return this;
    }

    protected executeWhenReady() {
        if (!this.waitToExecute && this.canExecute()) {
            this.execute();
        }
    }

    /**
     * Set the URL that this scenario will hit
     *
     * @param {string} url
     * @returns {Scenario}
     */
    public open(url: string): Scenario {
        // You can only load the url once per scenario
        if (!this.hasExecuted()) {
            this.url = url;
            this._isMock = false;
            this.executeWhenReady();
        }
        return this;
    }

    /**
     * Set the callback for the assertions to run after the request has a response
     */
    public then(callback: Function): Scenario {
        // If it hasn't already been executed
        if (!this.hasExecuted()) {
            this._then = callback;
            this.executeWhenReady();
        }
        return this;
    }

    /**
     * Alias for then()
     */
    public assertions(callback: Function): Scenario {
        return this.then(callback);
    }

    /**
     * Skip this scenario completely and mark it done
     *
     * @returns {Scenario}
     */
    public skip(message?: string): Scenario {
        if (!this.hasExecuted()) {
            message = "Skipped" + (message ? ': ' + message : '');
            this.start = Date.now();
            this.log.push(new CommentLine(message));
            this.end = Date.now();
            this.onDone(this);
        }
        return this;
    }

    protected getScenarioType(): { name: string, responseObject } {
        if (this.responseType == ResponseType.json) {
            return {
                name: 'REST End Point',
                responseObject: JsonResponse
            }
        }
        else if (this.responseType == ResponseType.image) {
            return {
                name: 'Image',
                responseObject: ImageResponse
            }
        }
        else if (this.responseType == ResponseType.script) {
            return {
                name: 'Script',
                responseObject: ScriptResponse
            }
        }
        else if (this.responseType == ResponseType.stylesheet) {
            return {
                name: 'Stylesheet',
                responseObject: CssResponse
            }
        }
        else if (this.responseType == ResponseType.resource) {
            return {
                name: 'Resource',
                responseObject: ResourceResponse
            }
        }
        else {
            return {
                name: 'HTML Page',
                responseObject: HtmlResponse
            }
        }
    }

    protected processResponse(simplifiedResponse: SimplifiedResponse) {
        let scenarioType: { name: string, responseObject } = this.getScenarioType();
        this.requestLoaded = Date.now();
        this.pass('Loaded ' + scenarioType.name + ' ' + this.url);
        if (this._then !== null && this.url !== null) {
            this._then(
                new scenarioType.responseObject(this, this.url, simplifiedResponse)
            );
        }
        this.done();
    }

    protected executeRequest() {
        if (!this.requestStart && this.url !== null) {
            let scenario: Scenario = this;
            this.requestStart = Date.now();
            this.options.uri = this.suite.buildUrl(this.url);
            if (this.responseType == ResponseType.image) {
                require('probe-image-size')(this.options.uri, this.options, function(error, result) {
                    if (!error) {
                        scenario.processResponse({
                            statusCode: 200,
                            body: JSON.stringify(result),
                            headers: {
                                'content-type': result.mime
                            }
                        });
                    }
                    else {
                        scenario.fail('Failed to load image ' + scenario.url);
                        scenario.done();
                    }
                });
            }
            else {
                request(this.options, function (error, response, body) {
                    if (!error) {
                        scenario.processResponse(Flagpole.toSimplifiedResponse(response, body));
                    }
                    else {
                        scenario.fail('Failed to load ' + scenario.url);
                        scenario.comment(error);
                        scenario.done();
                    }
                });
            }
        }
    }

    protected executeMock() {
        if (!this.requestStart && this.url !== null) {
            let scenario: Scenario = this;
            this.requestStart = Date.now();
            Mock.loadLocalFile(this.url).then(function (mock: Mock) {
                scenario.processResponse(mock);
            }).catch(function () {
                scenario.fail('Failed to load page ' + scenario.url);
                scenario.done();
            });
        }
    }

    /**
     * Execute this scenario
     */
    public execute(): Scenario {
        if (!this.hasExecuted() && this.url !== null) {
            this.start = Date.now();
            // If we waited first
            if (this.waitToExecute && this.initialized !== null) {
                this.log.push(new CommentLine('Waited ' + (this.start - this.initialized) + 'ms'));
            }
            // Execute it
            this._isMock ?
                this.executeMock() :
                this.executeRequest();
        }
        return this;
    }

    /**
     * Fake response from local file for testing
     */
    public mock(localPath: string): Scenario {
        this.url = localPath;
        this._isMock = true;
        this.executeWhenReady();
        return this;
    }

    /**
     * Override the next test's default pass/fail message with something custom and more human readable
     *
     * @param {string} message
     * @returns {Scenario}
     */
    public label(message: string): Scenario {
        this.nextLabel = message;
        return this;
    }

    public getTitle(): string {
        return this.title;
    }

    /**
     * Get the log buffer
     *
     * @returns {Array<ConsoleLine>}
     */
    public getLog(): Array<iLogLine> {
        return this.log;
    }

    /**
     * Find the total execution time of this scenario
     *
     * @returns {number}
     */
    protected getExecutionTime(): number {
        return (this.end !== null && this.start !== null) ?
            (this.end - this.start) : 0;
    }

    /**
     * Mark this scenario as completed
     *
     * @returns {Scenario}
     */
    public done(): Scenario {
        this.end = Date.now();
        this.log.push(new CommentLine("Took " + this.getExecutionTime() + 'ms'));
        this.onDone(this);
        return this;
    }

    /**
     * Get the url
     */
    public getUrl(): string | null {
        return this.url;
    }

    /**
     * 
     */
    public getRequestLoadTime(): number | null {
        return (this.requestLoaded && this.requestStart) ?
            (this.requestLoaded - this.requestStart): null;
    }

    /**
     * We ready to pull the trigger on this one?
     */
    public canExecute(): boolean {
        return (!this.hasExecuted() && this.url !== null && this._then !== null);
    }

    /**
     * Has this scenario already been executed?
     */
    public hasExecuted(): boolean {
        return this.start !== null;
    }

    /**
     * Did this scenario finish executing?
     */
    public hasFinished(): boolean {
        return this.hasExecuted() && this.end !== null;
    }

    /**
     * SET RESPONSE TYPE
     */

    protected setResponseType(type: ResponseType): Scenario {
        if (this.hasExecuted()) {
            throw new Error('Scenario was already executed. Can not change type.');
        }
        this.responseType = type;
        return this;
    }

    public image(): Scenario {
        return this.setResponseType(ResponseType.image);
    }

    public html(): Scenario {
        return this.setResponseType(ResponseType.html);
    }

    public json(): Scenario {
        return this.setResponseType(ResponseType.json);
    }

    public script(): Scenario {
        return this.setResponseType(ResponseType.script);
    }

    public stylesheet(): Scenario {
        return this.setResponseType(ResponseType.stylesheet);
    }

    public resource(): Scenario {
        return this.setResponseType(ResponseType.resource);
    }

}