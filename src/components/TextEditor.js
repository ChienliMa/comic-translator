import React, {Component} from 'react';
import { Editor, Plain } from "slate";
import Select from 'react-select';
import 'react-select/dist/react-select.css';

import {Text} from '../utils';
import CONST from '../constants';

let getFontOptions = require('../fontOptions.jsx');

class TextEditorComponent extends Component {
    constructor (props) {
        super(props);
        this.proxy = props.project.proxy;
        this.keyPressed = props.keyPressed;

        let demoText = new Text([0,0]);
        this.state = {
            text: demoText,
            editorState : Plain.deserialize(demoText.text)
        };

        this.hidden = true;
        this.multipleSelected = false;
    }

    componentDidMount () {
        this.proxy.subscribe("SelectText", this.selectText.bind(this));
        this.proxy.subscribe("SelectImg", this.selectPage.bind(this)); // need to unbind text when context change
    }

    selectPage () {
        let text = new Text();
        this.setState({
            text : text,
            editorState : Plain.deserialize(text.text)
        });
        this.hidden = true;
        this.multipleSelected = false;
        this.forceUpdate();
    }

    selectText (text) {
        if (text != null) {
            if (this.keyPressed[CONST.KEYCODE_ALT]) {
                this.multipleSelected = true;
            } else {
                this.setState({
                    text : text,
                    editorState : Plain.deserialize(text.text)
                });
                this.multipleSelected = false;
            }
            this.hidden = false;
        } else {
            this.hidden = true;
        }

        this.forceUpdate();
    }

    update (update) {
        this.proxy.trigger("UpdateText", update);
        this.forceUpdate();
    }

    updateText (editorState) {
        if (!this.multipleSelected) {
            let updatedText = Plain.serialize(editorState);
            let update = {text:updatedText};
            this.proxy.trigger("UpdateText", update);
            this.state.editorState = editorState;
            this.forceUpdate();
        }
    }


    render() {
        return (
            <div className="text-controller" style={{visibility:this.hidden?"hidden":"visible"}}>
                <div  className="item" style={{display:'block'}}>
                    <label >Font</label>
                    <div style={{paddingLeft:'136px'}}>
                        <Select
                            name="ffont"
                            value={this.state.text.style}
                            options={getFontOptions()}
                            onChange={(value)=>this.update({style:value.value})}
                        />
                    </div>

                </div>

                <div className="item">
                    <label>Size</label>
                    <input type="range" min="1" max="200" step="1"
                           value={this.state.text.size}
                           onChange={(e)=>this.update({size : parseInt(e.target.value)})} />
                </div>

                <div className="item">
                    <label>stroke</label>
                    <input type="range" min="-0" max="90" step="1"
                           value={this.state.text.strokeWidth}
                           onChange={(e)=>this.update({strokeWidth : parseInt(e.target.value)})}/>
                </div>

                <div className="item">
                    <label>Rotate</label>
                    <input type="range" min="-90" max="90" step="1"
                           value={this.state.text.rotate}
                           onChange={(e)=>this.update({rotate : parseInt(e.target.value)})}/>
                </div>

                <div className="item">
                    <label>lineGap</label>
                    <input type="range" min="0" max="100" step="1"
                           value={this.state.text.lineGap}
                           onChange={(e)=>this.update({lineGap : parseInt(e.target.value)})}/>
                </div>

                <div className="item" style={{visibility:(this.multipleSelected||this.hidden)?"hidden":"visible"}}>
                    <label>Content</label>
                    <Editor stlye={{backgroundColor:"#f6f6f6"}}
                            placeholder="Enter some text..."
                            onChange={editorState => this.updateText(editorState)}
                            state={this.state.editorState}/>
                </div>

                <div className="item" style={{textAlign: "center"}}>
                    <button>Close</button>
                </div>
            </div>
        )
    }
}


export default TextEditorComponent;