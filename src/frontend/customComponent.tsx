import React from "react";

export class CustomComponent<P = {}, S = {}, SS = any> extends React.Component<P, S, SS> {
    private _destroyed = false;

    // callback if component is still active to prevent
    apply<R = any>(promise: Promise<R>, cb: (resolve?: R, err?:Error | any) => void) {
        promise.then(r => {
            if (!this._destroyed) cb(r);
        }).catch(e => {
            if (!this._destroyed) cb(undefined, e);
        });
    }

    componentWillUnmount() {
        this._destroyed = true;
        super.componentWillUnmount();
    }
    get destroyed() {
        return this._destroyed;
    }
}
