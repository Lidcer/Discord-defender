import React from "react";
import { CustomComponent } from "./customComponent";
import styled from "styled-components";
import { discords, updateEmit } from "../index";
import { Discord, Log } from "../interfaces";
import { messages, updateEmitLog } from "../log";
import { join } from "path";
import { exec } from "child_process";
import { ipcRenderer } from "electron/renderer";


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
}

export default class Content extends CustomComponent<P, S> {

    constructor(props: P) {
        super(props);
        this.state = {
            discords: [],
            logs: [],
            warning: false,
        };
    }
    componentDidMount() {
        updateEmit.on("update", this.update);
        updateEmitLog.on("update", this.update);
        updateEmitLog.on("attention", this.colorRed);
        this.update();
    }
    componentWillUnmount() {
        updateEmit.off("update", this.update);
        updateEmitLog.off("update", this.update);
        updateEmitLog.off("attention", this.colorRed);
    }
    update = () => {
        const danger = messages.find(m => m.type === "error" || m.type === "warn");
        if (danger) {
            this.setState({discords, logs: messages, warning: true});
        } else {
            this.setState({discords, logs: messages});
        }
    };
    colorRed = () => {
        this.setState({ warning: true });
    };
    open(path: string) {
        exec(`explorer "${path}"`, () => {});
    }
    renderDiscord(discord: Discord) {
        const jsPath =join(discord.coreFiles.core, "index.js");
        return <Div onClick={() => this.open(jsPath)}>
            <h1>{discord.discord}</h1>
            Watching: <span>{jsPath}</span>
        </Div>;
    }
    shouldRunAtStartup() {
       return (window as any).autoLaunch;
    }
    runAtStartup(value: boolean) {
        (window as any).autoLaunch = value;
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
        return <Console>
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
        return <Warper style={this.state.warning ? {backgroundColor: "red"} : null}>
            {this.renderButtons()}
            {this.renderLogs()}
            <h1>Watching</h1>
            {this.state.discords.map((d, i) => {
                return <div key={i}> {this.renderDiscord(d)}</div>;
            })}
        </Warper>;
    }
}
