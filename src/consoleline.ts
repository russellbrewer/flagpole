import { Flagpole } from '.';
import { FlagpoleOutput } from './flagpole';

export enum ConsoleColor {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",

    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",

    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m"
}

export enum LogLineType {
    Pass,
    Fail,
    Comment,
    Heading,
    Subheading,
    Decoration
}

export interface iLogLine {
    timestamp: Date
    color: ConsoleColor
    message: string
    type: LogLineType
    toConsoleString(): string
    toString(): string
    toHTML(): string
    toJson(): string
    toCsv(): string
    toTsv(): string
    toPsv(): string
    print()
}

export abstract class LogLine implements iLogLine {

    public timestamp: Date;
    public color: ConsoleColor = ConsoleColor.FgWhite;
    public textPrefix: string = '';
    public textSuffix: string = '';
    public message: string = '';
    public type: LogLineType = LogLineType.Comment;

    static targetLineLength: number = 72;

    constructor(message: string) {
        this.timestamp = new Date();
        this.message = message;
    }

    protected getMergedString(): string {
        return (this.textPrefix + ' ' + this.message + ' ' + this.textSuffix);
    }

    protected getClassName(): string {
        return LogLineType[this.type];
    }

    public print() {
        if (!Flagpole.quietMode) {
            let line: string = '';
            let style: FlagpoleOutput = Flagpole.getOutput();
            if (style == FlagpoleOutput.text) {
                line = this.toString();
            }
            else if (style == FlagpoleOutput.html) {
                line = this.toHTML();
            }
            else if (style == FlagpoleOutput.json) {
                let json = this.toJson();
                if (typeof json != 'string') {
                    line = JSON.stringify(json);
                }
            }
            else if (style == FlagpoleOutput.csv) {
                line = this.toCsv();
            }
            else if (style == FlagpoleOutput.tsv) {
                line = this.toTsv();
            }
            else if (style == FlagpoleOutput.psv) {
                line = this.toPsv();
            }
            else {
                line = this.toConsoleString();
            }
            if (line.length > 0) {
                console.log(line);
            }
        }
    }

    public toConsoleString(): string {
        return this.color + this.getMergedString() + ConsoleColor.Reset;
    }

    public toCsv(): string {
        return '"' + this.timestamp.toUTCString() + '","' + this.getClassName() + '","' +
            this.textPrefix + '","' + this.message + '","' + this.textSuffix + '"';
    }

    public toTsv(): string {
        return this.timestamp.toUTCString() + "\t" + this.getClassName() + "\t" +
            this.textPrefix + "\t" + this.message + "\t" + this.textSuffix;
    }

    public toPsv(): string {
        return this.timestamp.toUTCString() + "|" + this.getClassName() + "|" +
            this.textPrefix + "|" + this.message + "|" + this.textSuffix;
    }

    public toString(): string {
        return this.getMergedString();
    }

    public toHTML(): string {
        return '<li class="' + this.getClassName() + '">' + this.message +
            (this.textSuffix.length > 0 ? ' <span class="note">' + this.textSuffix + '</span>' : '') +
            "</li>\n";
    }

    public toJson(): any {
        return {
            type: this.getClassName(),
            message: this.message
        }
    }

}

export class HeadingLine extends LogLine implements iLogLine {

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = LogLineType.Heading;
    }

    protected getMergedString(): string {
        let text: string = super.getMergedString().trim();
        let padLength: number = Math.ceil((LogLine.targetLineLength - text.length) / 2);
        return ' '.repeat(padLength) + text + ' '.repeat(padLength);
    }

    public toHTML(): string {
        return '<h2 class="' + this.getClassName() + '">' + this.message + '</h2>';
    }

}

export class SubheadingLine extends LogLine implements iLogLine {

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgWhite;
        this.type = LogLineType.Subheading;
    }

    public toHTML(): string {
        return '<h3 class="' + this.getClassName() + '">' + this.message + '</h2>';
    }

}

export class DecorationLine extends LogLine implements iLogLine {

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = LogLineType.Decoration;
    }

    public toHTML(): string {
        return '<div class="' + this.getClassName() + '">' + this.message + '</div>';
    }

    public toJson(): string {
        return '';
    }

}

export class HorizontalRule extends LogLine implements iLogLine {

    constructor(message: string = '=') {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = LogLineType.Decoration;
    }

    protected getMergedString(): string {
        let text: string = this.message;
        let reps: number = Math.ceil(LogLine.targetLineLength / text.length);
        return text.repeat(reps);
    }

    public toHTML(): string {
        return '<hr class="decoration" />';
    }

    public toJson(): string {
        return '';
    }

}

export class CustomLine extends LogLine implements iLogLine {

    constructor(message: string, color: ConsoleColor) {
        super(message);
        this.color = color;
        this.type = LogLineType.Comment;
    }

    public toHTML(): string {
        return '<div class="' + this.getClassName() + '">' + this.message + '</div>';
    }

    public toJson(): string {
        return '';
    }

}

export class LineBreak extends LogLine implements iLogLine {

    constructor() {
        super(' ');
        this.type = LogLineType.Decoration;
    }

    public toHTML(): string {
        return '<br />';
    }

    public toJson(): string {
        return '';
    }

}

export class CommentLine extends LogLine implements iLogLine {

    public textPrefix: string = '  »  ';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgCyan;
        this.type = LogLineType.Comment;
    }

}

export class PassLine extends LogLine implements iLogLine {

    public textPrefix: string = '  ✔  ';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgGreen;
        this.type = LogLineType.Pass;
    }

}

export class FailLine extends LogLine implements iLogLine {

    public textPrefix: string = '  ✕  ';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgRed;
        this.type = LogLineType.Fail;
    }

}
