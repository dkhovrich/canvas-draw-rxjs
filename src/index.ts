import "materialize-css/dist/css/materialize.css";

import { fromEvent, merge, Observable } from "rxjs";
import {
    map,
    pairwise,
    startWith,
    switchMap,
    takeUntil,
    withLatestFrom
} from "rxjs/operators";

type Point = {
    x: number;
    y: number;
};

type Options = {
    lineWidth: number;
    color: string;
};

type DrawData = {
    from: Point;
    to: Point;
    options: Options;
};

const canvas = document.querySelector("canvas")!;
const range = document.querySelector<HTMLInputElement>("#range")!;
const color = document.querySelector<HTMLInputElement>("#color")!;

const ctx = canvas.getContext("2d")!;
const rect = canvas.getBoundingClientRect();
const scale = window.devicePixelRatio;

canvas.width = rect.width * scale;
canvas.height = rect.height * scale;
ctx.scale(scale, scale);

const mouseMove$ = fromEvent<MouseEvent>(canvas, "mousemove");
const mouseDown$ = fromEvent<MouseEvent>(canvas, "mousedown");
const mouseUp$ = fromEvent<MouseEvent>(canvas, "mouseup");
const mouseOut$ = fromEvent<MouseEvent>(canvas, "mouseout");

function createInputStream(element: HTMLInputElement): Observable<string> {
    return fromEvent(element, "input").pipe(
        map((event) => (event.target as HTMLInputElement).value),
        startWith(element.value)
    );
}

const lineWidth$ = createInputStream(range);
const color$ = createInputStream(color);

const stream$ = mouseDown$.pipe(
    withLatestFrom(
        lineWidth$,
        color$,
        (_, lineWidth, color): Options => ({ lineWidth: +lineWidth, color })
    ),
    switchMap((options) =>
        mouseMove$.pipe(
            map(
                (event): Point => ({
                    x: event.offsetX,
                    y: event.offsetY
                })
            ),
            pairwise(),
            map(([from, to]): DrawData => ({ from, to, options })),
            takeUntil(merge(mouseUp$, mouseOut$))
        )
    )
);

function draw({ from, to, options }: DrawData): void {
    ctx.lineWidth = options.lineWidth;
    ctx.strokeStyle = options.color;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

stream$.subscribe(draw);
