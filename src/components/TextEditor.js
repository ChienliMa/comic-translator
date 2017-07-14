import React, {Component} from 'react';
import { Editor, Plain } from "slate";
import {Text} from '../utils';

class TextEditorComponent extends Component {
    constructor (props) {
        super(props);
        this.proxy = props.project.proxy;
        let demoText = new Text([0,0]);
        this.state = {
            text: demoText,
            editorState : Plain.deserialize(demoText.text)
        };
    }

    componentDidMount () {
        this.proxy.subscribe("SelectText", this.bindToText.bind(this));
        this.proxy.subscribe("SelectImg", this.unbindText.bind(this)); // need to unbind text when context change
    }

    unbindText () {
        let text = new Text();
        this.setState({
            text : text,
            editorState : Plain.deserialize(text.text)
        });
    }

    bindToText (text) {
        this.setState({
            text : text,
            editorState : Plain.deserialize(text.text)
        });
        this.forceUpdate();
    }

    updateFontSize (event) {
        let update = {fontSize:event.target.value};
        this.proxy.trigger("UpdateText", update);

        this.state.text.fontSize = event.target.value;
        this.forceUpdate();
    }


    updateRotate (event) {
        let update = {rotate:event.target.value};
        this.proxy.trigger("UpdateText", update);

        this.state.text.rotate = event.target.value;
        this.forceUpdate();
    }

    updateStroke (event) {
        let update = {strokeWidth:event.target.value};
        this.proxy.trigger("UpdateText", update);

        this.state.text.strokeWidth = event.target.value;
        this.forceUpdate();
    }

    updateLineGap (event) {
        let update = {lineGap:event.target.value};
        this.proxy.trigger("UpdateText", update);

        this.state.text.lineGap = event.target.value;
        this.forceUpdate();
    }

    updateText (editorState) {
        let updatedText = Plain.serialize(editorState);
        let update = {text:updatedText};
        this.proxy.trigger("UpdateText", update);
        this.state.editorState = editorState;
        this.forceUpdate();
    }


    render() {
        return (
            <div className="text-controller">
                <div className="item">
                    <label>Size</label>
                    <input type="range" min="1" max="200" step="1"
                           value={this.state.text.fontSize} onChange={this.updateFontSize.bind(this)} />
                </div>

                <div className="item">
                    <label>stroke</label>
                    <input type="range" min="-0" max="90" step="1"
                           value={this.state.text.strokeWidth} onChange={this.updateStroke.bind(this)} />
                </div>

                <div className="item">
                    <label>Rotate</label>
                    <input type="range" min="-90" max="90" step="1"
                           value={this.state.text.rotate} onChange={this.updateRotate.bind(this)} />
                </div>

                <div className="item">
                    <label>lineGap</label>
                    <input type="range" min="0" max="6" step="1"
                           value={this.state.text.lineGap} onChange={this.updateLineGap.bind(this)} />
                </div>



                <div className="item">
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