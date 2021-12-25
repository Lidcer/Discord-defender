//import React from "react";
import styled from "styled-components";
import TitleBar from "./titleBar";
import Content from "./content";
import { perform } from "./core/core";
import React from "react";
//import { BrowserWindow } from "@electron/remote/";

const Warper = styled.div`
    background-color: black;
    color: black;
    height: 100%;
    width: 100%;
    display:flex;
    flex-direction: column;
`;

export default class Main extends React.Component {
    render() {
        return <Warper>
            <TitleBar />
            <Content/>
        </Warper>;
    }
}


perform();
console.info("Discord defender has started!");
