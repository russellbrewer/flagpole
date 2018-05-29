import { iResponse, SimplifiedResponse } from "./index";
import { Scenario } from "./scenario";
import { Element, Value, iProperty } from "./property";
export declare abstract class GenericRequest implements iResponse, iProperty {
    readonly scenario: Scenario;
    protected url: string;
    protected response: SimplifiedResponse;
    protected flipAssertion: boolean;
    private _lastElement;
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    assert(statement: boolean, passMessage: any, failMessage: any): iResponse;
    protected reset(): iResponse;
    not(): iResponse;
    lastElement(property?: Element): Element;
    get(): any;
    echo(): iProperty;
    typeof(): iProperty;
    and(): Element;
    comment(message: string): iResponse;
    headers(key?: string): Value;
    status(): Value;
    label(message: string): iResponse;
    text(): Value;
    length(): Value;
    contains(string: string): iResponse;
    matches(pattern: RegExp): iResponse;
    startsWith(matchText: string): iResponse;
    endsWith(matchText: string): iResponse;
    trim(): Value;
    toLowerCase(): Value;
    toUpperCase(): Value;
    replace(search: string | RegExp, replace: string): Value;
    is(type: string): iResponse;
    each(callback: Function): iResponse;
    exists(): iResponse;
    parseInt(): Value;
    parseFloat(): Value;
    greaterThan(value: number): iResponse;
    greaterThanOrEquals(value: number): iResponse;
    lessThan(value: number): iResponse;
    lessThanOrEquals(value: number): iResponse;
    equals(value: any, permissiveMatching: boolean): iResponse;
    similarTo(value: any): iResponse;
    abstract select(path: string, findIn?: any): Element;
}