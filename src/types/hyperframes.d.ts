/* eslint-disable @typescript-eslint/no-empty-object-type */

/**
 * Type declarations for @hyperframes/player web component.
 * Allows <hyperframes-player> to be used as a JSX intrinsic element in TSX.
 */

declare namespace JSX {
    interface IntrinsicElements {
        "hyperframes-player": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement> & {
                src?: string;
                controls?: boolean;
                autoplay?: boolean;
                loop?: boolean;
                muted?: boolean;
                poster?: string;
                "playback-rate"?: number;
                width?: number | string;
                height?: number | string;
            },
            HTMLElement
        >;
    }
}
