import React, { createRef } from "react";
import styled from "styled-components";
import { discords, updateEmit } from "./core/core";
import { Discord, Log } from "./interfaces";
import { messages, updateEmitLog } from "./core/log";
import { join } from "path";
import { exec } from "child_process";
import { ipcRenderer } from "electron";

const Warper = styled.div`
    background-color: #36393f;
    padding: 5px;
    overflow: auto; 
    color: white;
    height: calc(100% - 10px);
    width: calc(100% - 10px);
`;
const Div = styled.div`
    margin: 5px;
    padding: 5px;
    cursor: pointer;
    :hover {
        background-color: #282b2e;
    }
`;
const Div2 = styled.div`
    margin: 5px;


`;

const Console = styled.div`
    border: 1px solid black;
    height: 50%;
    overflow: auto;
`;
const Button = styled.button`
    border: 1px solid black;
    padding: 2px;
    background: gray;
    outline: none;
`;

interface P {

}

interface S {
    discords: Discord[];
    logs: Log[],
    warning: boolean,
    startOnBoot: boolean,
}

export default class Content extends React.Component<P, S> {
    private ref = createRef<HTMLDivElement>();
    constructor(props: P) {
        super(props);
        const urlSearchParams = new URLSearchParams(window.location.search);

        this.state = {
            discords: [],
            logs: [],
            warning: false,
            startOnBoot: urlSearchParams.get("s") === "true" || false,
        };
    }
    componentDidMount() {
        updateEmit.on("update", this.update);
        updateEmit.on("attention",  this.colorRed);
        updateEmitLog.on("update", this.update);
        this.update();
    }
    componentWillUnmount() {
        updateEmit.off("update", this.update);
        updateEmit.off("attention",  this.colorRed);
        updateEmitLog.off("update", this.update);
    }
    update = () => {
        this.setState({discords, logs: messages});
        if(this.ref &&this.ref.current) {
            this.ref.current.scrollBy({top: Number.MAX_SAFE_INTEGER});
        }
    };
    colorRed = () => {
        this.setState({ warning: true });
    };
    open(path: string) {
        exec(`explorer "${path}"`, () => {});
    }
    renderDiscord(discord: Discord) {
        return <Div>
            <h1>{discord.discord}</h1>
            Watching: {discord.coreFiles.map((e,i) => {
                const path = join(e.core, "index.js");
                return <div key={i} onClick={() => this.open(path)}>{path}</div>;
            })}
        </Div>;
    }
    shouldRunAtStartup() {
        return this.state.startOnBoot;
    }
    runAtStartup(value: boolean) {
        this.setState({startOnBoot: value});
        ipcRenderer.send("autoLaunch", { value });
    }
    toggleStartup() {
        this.runAtStartup(!this.shouldRunAtStartup());
        this.forceUpdate();
    }

    renderButtons() {
        return <Div2>
            Run at startup:
            <Button onClick={() => this.toggleStartup()}>{this.shouldRunAtStartup() ? "Enabled" : "Disabled"}</Button>
        </Div2>;
    }

    renderLog(log: Log) {
        return <>[{log.type}] {log.dateFormatted}: {log.message}</>;
    }
    renderLogs() {
        return <Console ref={this.ref}>
            {this.state.logs.map((l,i) => <div key={i}>{this.renderLog(l)}</div>)}
        </Console>;
    }
    render() {
        if (!this.state.discords.length) {
            return <Warper>
                {this.renderButtons()}
                {this.renderLogs()}
                No discord detected!
            </Warper>;
        }
        return <Warper style={this.state.warning ? {backgroundColor: "red"} : {}}>
            {this.renderButtons()}
            {this.renderLogs()}
            <h1>Watching</h1>
            {this.state.discords.map((d, i) => {
                return <div key={i}> {this.renderDiscord(d)}</div>;
            })}
        </Warper>;
    }
}
