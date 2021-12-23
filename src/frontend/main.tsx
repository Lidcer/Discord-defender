import React from "react";
import { CustomComponent } from "./customComponent";
import styled from "styled-components";
import TitleBar from "./navigationBar";
import Content from "./content";
import { perform } from "../index";
import { BrowserWindow } from "@electron/remote/";

const Warper = styled.div`
    background-color: black;
    color: black;
    height: 100%;
    width: 100%;
    display:flex;
    flex-direction: column;
`;

export default class Main extends CustomComponent {
    render() {
        return <Warper>
            <TitleBar />
            <Content/>
        </Warper>;
    }
}
if ((window as any).autoLaunch) {
    BrowserWindow.getFocusedWindow().hide();
}

perform();
console.info("Discord defender has started!");
