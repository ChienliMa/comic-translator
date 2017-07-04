import React, { Component } from 'react';
import { Editor, Plain } from "slate";


import './App.css';

const testimg = require("./testimg.jpeg");

const VERTICALLY = 'vertivally';
const HORIZENTALLY = 'horizentally';

const DRAG_RECT = "DRAG_RECT";
const DRAG_TEXT = "DRAG_TEXT";
const DRAG_NOTHING = "DRAG_NOTHING";
const NOT_DRAGGING = "NOT_DRAGGING";
const DRAG_START = "DRAG_START";

const KEYCODE_E = 69;
const KEYCODE_F = 70;
const KEYCODE_G = 71;
const KEYCODE_W = 87;

const KEYCODE_SPACE = 32;


function distance (a, b) {
    var sum = 0;
    for (var i=0; i < a.length; i++){
        sum += (a[i] - b[i])*(a[i] - b[i]);
    }
    return Math.sqrt(sum);
}

class Project {
    constructor (){
        this.name = "";
        this.pages = [];
        this.proxy = new EventProxy();
    }
}

class Page {
    constructor (src){
        this.src = src;
        this.rects = []; // rects that cover original texts
        this.texts = [];
    }
}

class Text {
    constructor (pos) {
        this.pos = pos;
        this.text = "你好 \n     哈哈";

        this.fontSize = 30;
        this.fontStyle = "serif";

        this.strokeWidth = 0;
        this.isVertical = true;
    }
}


class TextComponent extends Component {
    constructor (props) {
        super(props);
        this.state = props.text;
        this.keyPressed = props.keyPressed;
        this.proxy = props.proxy;
        this.dragState = NOT_DRAGGING;
        this.oriPos = [0,0];
        this.anchor = [0,0];
    }


    componentDidMount () {
        document.body.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    componentWillMount () {
        document.body.removeEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onMouseDown (event) {
        if (!this.keyPressed[KEYCODE_F]) {
            this.anchor = [event.clientX, event.clientY];
            this.oriPos = [].concat(this.state.pos);
            this.dragState = DRAG_START;
        }
    }

    onMouseMove (event) {
        if (this.dragState == DRAG_START) { // / onclick
            this.dragState = DRAG_TEXT;
        }

        if (this.dragState == DRAG_TEXT) {
            let x = this.oriPos[0] + event.clientX - this.anchor[0];
            let y = this.oriPos[1] + event.clientY - this.anchor[1];
            this.setState({pos:[x,y]});
        }
    }

    onMouseUp (event) {
        if (this.dragState == DRAG_START) { // onclick
            this.proxy.trigger("SelectText", this.state);
            this.proxy.clearSubscribes("UpdateText");
            this.proxy.subscribe("UpdateText", this.setState.bind(this));
        }
        this.dragState = DRAG_NOTHING;
    }

    render () {
        let tspans = [];
        let writtingMode = "";

        if (this.state.isVertical) {
            this.state.text.split("\n").forEach( (line, index) => {
                let dy = line.length - line.trim().length;
                tspans.push(<tspan y={this.state.pos[1] + dy*this.state.fontSize*0.1} dx={-index * this.state.fontSize}>{line.trim()}</tspan>)
            })
            writtingMode = "tb";
        } else {
            this.state.text.split("\n").forEach( (line, index) => {
                let dx = line.length - line.trim().length;
                tspans.push(<tspan x={this.state.pos[0] + dx*this.state.fontSize*0.1} dy={index * this.state.fontSize}>{line.trim()}</tspan>)
            })
        }

        return (
                <text style={{writingMode:writtingMode}} alignmentBaseline="hanging"
                       x={this.state.pos[0]} y={this.state.pos[1]}
                      fontSize={this.state.fontSize} fontFamily={this.state.fontStyle} strokeWidth={this.state.strokeWidth}
                      stroke="#ffffff" fill="#000000"
                      onMouseDown={this.onMouseDown.bind(this)}  onMouseUp={this.onMouseUp.bind(this)}
                >
                    {tspans}
                </text>
        )
    }

}

class Rect {
    constructor (pos1, pos2) {
        this.pos1 = pos1;
        this.pos2 = pos2;
    }

    renderOnContext(ctx) {
        const [x,y] = this.pos1;
        const [x1, y1] = this.pos2;
        ctx.fillStyle = "white";
        ctx.fillRect(x, y, x1 - x, y1 - y);
    }
}

class EventProxy {
    constructor () {
        this.events = {};
    }

    subscribe (event, callback) {
        if (this.events[event] == null) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    clearSubscribes (event) {
        this.events[event] = [];
    }

    trigger (event, msg) {
        if ( this.events[event] ) {
            this.events[event].map((callback)=>{return callback(msg);});
        }

    }
}

const proxy = new EventProxy();


class App extends Component {

    constructor (props) {
        super(props);
        this.state = new Project();
    }

  render() {
    return (
      <div className="App">
          <div style={{display: "flex", width: "100%", height: "100%", position: "absolute"}}>
              <GalleryComponent project={this.state}/>
              <div id="EditorContainer" style={{display:"flex", width: "80%", backgroundColor:"#FF0000", flexGrow: 3, overflow:"scroll"}}>
                  <InteractiveEditor project={this.state}/>
              </div>
          </div>
      </div>
    );
  }
}

class InteractiveEditor extends Component {
    constructor(props) {
        super(props);

        this.project = props.project;

        const page = new Page();
        const demo_img = new Image();
        demo_img.src = testimg;
        page.image = demo_img;

        this.state = page;
        // for interactive component
        this.drag = {};
        this.drag.state = "";
        this.drag.item = null;
        this.drag.startPos = null;

        this.keyPressed = {};

        this.hidden = false;

    }

    componentDidMount() {
        this.project.proxy.subscribe("SelectImg", this.switchToPage.bind(this));

        this.ctxes = {};
        this.ctxes.base = document.getElementById("BaseCanvas").getContext("2d");
        this.ctxes.rect = document.getElementById("RectCanvas").getContext("2d");

        this.textSvg = document.getElementById("TextSvg");


        this.loadDemoImage();
        this.registerListeners();
        this.resizeCanvases();
        this.refreshAllCanvases();
    }

    componentWillMount () {
        const model = this;
        document.body.removeEventListener('keydown', model.onKeyDown.bind(model));
        document.body.removeEventListener('keyup', model.onKeyUp.bind(model));
        this.project.proxy.clearSubscribes("SelectImg");
    }

    loadDemoImage() {
        this.state.image.onload = () => {this.resizeCanvases(); this.refreshAllCanvases();};
    }

    registerListeners () {
        const model = this;
        document.body.addEventListener('keydown', model.onKeyDown.bind(model));
        document.body.addEventListener('keyup', model.onKeyUp.bind(model));
    }

    switchToPage (page) {
        this.state = page;
        this.forceUpdate(()=>{
            this.resizeCanvases();
            this.refreshAllCanvases();
        });
    }

    onKeyDown (event) {
        this.keyPressed[event.keyCode] = true;

        if (event.keyCode === KEYCODE_W && !this.hidden) {
            this.hidden = true;
            this.clearRectCanvas();
            this.textSvg.setAttribute("visibility","hidden");
        }
    }

    onKeyUp (event) {
        this.keyPressed[event.keyCode] = false;

        if (event.keyCode === KEYCODE_W && this.hidden) {
            this.hidden = false;
            this.renderRectCanvas();
            this.textSvg.setAttribute("visibility","visible");
        }
    }

    resizeCanvases () {
        for(let ctx in this.ctxes) {
            this.ctxes[ctx].canvas.width = this.state.image.width;
            this.ctxes[ctx].canvas.height = this.state.image.height;
        }
        this.textSvg.setAttribute("width", this.state.image.width);
        this.textSvg.setAttribute("height", this.state.image.height);
    }

    refreshAllCanvases () {
        this.refreshBaseCanvas();
        this.refreshRectCanvas();
    }

    refreshBaseCanvas () {
        this.ctxes.base.drawImage(this.state.image, 0, 0);
    }

    refreshRectCanvas () {
        this.clearRectCanvas();
        this.renderRectCanvas();
    }


    clearRectCanvas () {
        const canvas = this.ctxes.rect.canvas;
        this.ctxes.rect.clearRect(0,0,canvas.width,canvas.height);
    }

    renderRectCanvas () {
        this.state.rects.map((x) => {x.renderOnContext(this.ctxes.rect)});
    }
    
    getScaledPosition (event) {
        let scale = this.ctxes.base.canvas.width /this.ctxes.base.canvas.offsetWidth;
        let x = Math.round(event.nativeEvent.offsetX * scale);
        let y = Math.round(event.nativeEvent.offsetY * scale);
        return [x,y]
    }

    onClick (event) {
        if (this.keyPressed[KEYCODE_E]) {
            const pos = this.getScaledPosition(event);
            let text = new Text(pos);

            this.state.texts.push(text);
            this.forceUpdate();
        }
    }

    onMouseDown(event) {
        const pos = this.getScaledPosition(event);

        if (this.keyPressed[KEYCODE_F]) {
            this.rectDragStart(pos);
        } else if (this.keyPressed[KEYCODE_E]) {
            // this.textDragStart(pos);
            // this.drag.state = DRAG_TEXT;
        }
    }

    rectDragStart (pos) {
        const newRect = new Rect(pos, [].concat(pos)); // copy a new object
        this.state.rects.push(newRect);
        this.drag.state = DRAG_RECT;
        this.drag.item = newRect;
    }

    onMouseMove (event) {
        if (this.drag.state == NOT_DRAGGING ){
            this.drag.state = DRAG_NOTHING
            return;
        }

        const pos = this.getScaledPosition(event);
        if ( pos.includes(0)) return; // the last ondrag before ondrag end will return negative value
        switch (this.drag.state){
            case DRAG_RECT:
                this.rectDragUpdate(pos);
                break;
            default:
        }
    }

    rectDragUpdate (pos) {
        this.drag.item.pos2 = [].concat(pos);
        this.refreshRectCanvas();
    }

    onMouseUp (event) {
        this.drag = {state : ""};
    }

    render() {
        let texts = [];
        this.state.texts.forEach((text, index) =>{
            texts.push(<TextComponent keyPressed={this.keyPressed} proxy={this.project.proxy}
                                      text={text} key={this.state.key + "," + index}/>)
        });

        return (
            <div style={{position: "relative", overflow: "scroll", width: "100%"}} >
                <canvas id="BaseCanvas"  style={{position: "absolute", zIndex: 1, float:"left"}}/>
                <canvas id="RectCanvas" style={{position: "absolute", zIndex: 2, float:"left"}}/>
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
                     id="TextSvg" style={{position: "absolute", zIndex: 7, float:"left"}}
                     onMouseUp={this.onMouseUp.bind(this)} onMouseMove={this.onMouseMove.bind(this)}
                     onMouseDown ={this.onMouseDown.bind(this)} onClick={this.onClick.bind(this)}>
                    {texts}
                </svg>
                <TextEditorComponent id="TextEditor" project={this.project} />
            </div>
        )
    }
}


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
        this.proxy.subscribe("SelectText", this.switchToText.bind(this));
    }

    switchToText (text) {
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

    updateText (editorState) {
        let updatedText = Plain.serialize(editorState);
        let update = {text:updatedText};
        this.proxy.trigger("UpdateText", update);
        this.state.editorState = editorState;
        this.forceUpdate();
    }


    render() {
        let sss = 333;
        return (
            <div style={{position:"absolute", backgroundColor:"gray", right: 15, top:10, zIndex:10}}>
                <label>Size</label><p/>
                <input type="range" min="1" max="50" step="1"
                       value={this.state.text.fontSize} onChange={this.updateFontSize.bind(this)} /><p/>

                <label>Content</label><p/>
                <Editor stlye={{backgroundColor:"#ffffff"}}
                        placeholder="Enter some text..."
                        onChange={editorState => this.updateText(editorState)}
                        state={this.state.editorState}/>
            </div>
        )
    }
}


class GalleryComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = props.project;
    }

    uploadImages(event) {
        const files = event.target.files; //FileList object

        const loadImage = (event) => {

            const page = new Page();
            page.image = new Image();
            page.image.src = event.target.result;

            page.key = this.state.pages.length;
            page.image.crossOrigin = "Anonymous";

            this.state.pages.push(page);
            this.setState(this.state);
        };

        for(let file of files)
        {
            const picReader = new FileReader();
            picReader.addEventListener("load", loadImage.bind(this));
            picReader.readAsDataURL(file);
        }
    }

    renderThumbnails() {
        return (
            this.state.pages.map(
                (page) => {
                    return ( <ThumbnailComponent page={page} key={page.key} proxy={this.state.proxy}/>)
                }
            )
        )
    }

    render() {
        return (
            <div style={{width: "20%", display: "flex", flexDirection: "column", overflow:"scroll", backgroundColor:"#0000FF"}}>
                {this.renderThumbnails()}
                <input id="fileId2" type="file" multiple="multiple" onChange={(e)=> this.uploadImages(e)}/>
            </div>
        )
    }
}


class ThumbnailComponent extends Component {
    constructor (props) {
        super(props);
        this.page = props.page;
        this.proxy = props.proxy;
    }

    onClick () {
        this.proxy.trigger("SelectImg", this.page);
    }

    render () {
        return(
            <img src={this.page.image.src} onClick={this.onClick.bind(this)}
                 style={{maxWidth:"100%", display:"block",float:"left"}}/>
        )
    }
}
export default App;
