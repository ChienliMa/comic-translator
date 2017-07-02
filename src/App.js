import React, { Component } from 'react';
import {throttle} from 'throttle-debounce';

import './App.css';

const testimg = require("./testimg.jpeg");

const VERTICALLY = 'vertivally';
const HORIZENTALLY = 'horizentally';

const DRAG_RECT = "DRAG_RECT";
const DRAG_TEXT = "DRAG_TEXT";
const DRAG_NOTHING = "DRAG_NOTHING";
const NOT_DRAGGING = "NOT_DRAGGING";

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
        this.x = pos[0];
        this.y = pos[1];
        this.text = "fdsfs";
        this.width = 0;
        this.height = 0;

        // for dragging
        this.anchor = null;
        this.oriPos = null;

        this.fontSize = 15;
        this.fontStyle = "serif";
        this.lineGap = 3;
        this.svg = null;
    }

    mouseWithin (pos) {
        var bbox = this.svg.getBBox();
        const [x, y] = this.pos;
        return (x <= pos[0] && pos[0] <= x + bbox.width &&
                y <= pos[1] && pos[1] <= y + bbox.height);
    }

    setAnchor (pos) {
        this.anchor = [].concat(pos);
        this.oriPos = [].concat(this.pos);
    }

    clearAnchor () {
        this.anchor = null;
        this.oriPos = null;
    }

    anchorMoveTo (pos) {
        this.pos[0] = this.oriPos[0] + pos[0] - this.anchor[0];
        this.pos[1] = this.oriPos[1] + pos[1] - this.anchor[1];

        this.svg.setAttributeNS(null,"x", this.pos[0]);
        this.svg.setAttributeNS(null,"y",this.pos[1]);
    }

    getFont () {
        return this.fontSize + "px " + this.fontStyle;
    }

    renderOnContext (ctx) {
        ctx.font = this.getFont();
        this.width = 0;
        this.height = 0;

        let count = 0;
        ctx.fillStyle = "black";
        ctx.textBaseline="hanging";
        const [x, y] = this.pos;
        for (let text of this.text.split("\n")) {
            this.width = Math.max(this.width, ctx.measureText(text).width);
            this.height = this.height + this.lineGap + this.fontSize;
            ctx.fillText(text, x, y + count * (this.lineGap + this.fontSize));
            count = count + 1;
        }

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

    trigger (event, msg) {
        this.events[event].map((callback)=>{return callback(msg);});
    }
}

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
        this.state = props;

        const page = new Page();
        const demo_img = new Image();
        demo_img.src = testimg;
        page.image = demo_img;

        this.page = page;

        // for interactive component
        this.drag = {};
        this.drag.state = "";
        this.drag.item = null;
        this.drag.startPos = null;

        this.keyPressed = {};

        this.hidden = false;
    }

    componentDidMount() {
        this.state.project.proxy.subscribe("SelectImg", this.switchToPage.bind(this));

        this.ctxes = {};
        this.ctxes.base = document.getElementById("BaseCanvas").getContext("2d");
        this.ctxes.rect = document.getElementById("RectCanvas").getContext("2d");
        this.ctxes.text = document.getElementById("TextCanvas").getContext("2d");
        this.svg = document.getElementById("TextSvg");

        this.loadDemoImage();
        this.registerListeners();
    }

    loadDemoImage() {
        this.page.image.onload = () => {this.resizeCanvases(); this.refreshAllCanvases();};
    }

    registerListeners () {
        const model = this;
        document.body.addEventListener('keydown', model.onKeyDown.bind(model));
        document.body.addEventListener('keyup', model.onKeyUp.bind(model));
    }

    onKeyDown (event) {
        this.keyPressed[event.keyCode] = true;

        if (event.keyCode === KEYCODE_W && !this.hidden) {
            this.hidden = true;
            this.clearRectCanvas();
            this.clearTextCanvas();
        }
    }

    onKeyUp (event) {
        this.keyPressed[event.keyCode] = false;

        if (event.keyCode === KEYCODE_W && this.hidden) {
            this.hidden = false;
            this.renderRectCanvas();
            this.renderTextCanvas();
        }
    }

    switchToPage (page) {
        this.page = page;
        this.resizeCanvases();
        this.refreshAllCanvases();
    }

    resizeCanvases () {
        for(let ctx in this.ctxes) {
            this.ctxes[ctx].canvas.width = this.page.image.width;
            this.ctxes[ctx].canvas.height = this.page.image.height;
        }
        this.svg.setAttribute("width", this.page.image.width);
        this.svg.setAttribute("height", this.page.image.height);
    }

    refreshAllCanvases () {
        this.refreshBaseCanvas();
        this.refreshRectCanvas();
        this.refreshTextCanvas();

    }

    refreshBaseCanvas () {
        this.ctxes.base.drawImage(this.page.image, 0, 0);
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
        this.page.rects.map((x) => {x.renderOnContext(this.ctxes.rect)});
    }


    refreshTextCanvas () {
        this.clearTextCanvas();
        this.renderTextCanvas();
    }

    clearTextCanvas () {
        const canvas = this.ctxes.text.canvas;
        this.ctxes.text.clearRect(0,0,canvas.width,canvas.height);
    }

    renderTextCanvas () {
        this.page.texts.map((x) => {x.renderOnContext(this.ctxes.text);});
    }

    getMouseRelativePosition(event) {
        return [event.nativeEvent.offsetX, event.nativeEvent.offsetY];
    }

    onClick(event) {
        if (this.keyPressed[KEYCODE_E]) {
            const pos = this.getMouseRelativePosition(event);
            // this.page.texts.push(new Text(pos));
            // this.refreshTextCanvas();


            let text = new Text(pos);
            let newText = document.createElementNS("http://www.w3.org/2000/svg","text");
            newText.setAttributeNS(null,"x",pos[0]);
            newText.setAttributeNS(null,"y",pos[1]);
            newText.setAttributeNS(null,"alignment-baseline","hanging");
            let textNode = document.createTextNode(text.text);
            newText.appendChild(textNode);

            this.svg.appendChild(newText);
            text.svg = newText;
            var lll = newText.getBBox();
            var ll = text.svg.getBBox();

            this.page.texts.push(text);
        }
    }

    onMouseDown(event) {
        const pos = this.getMouseRelativePosition(event);

        if (this.keyPressed[KEYCODE_F]) {
            this.rectDragStart(pos);
        } else if (this.keyPressed[KEYCODE_E]) {
            this.textDragStart(pos);
        }
    }

    rectDragStart (pos) {
        const newRect = new Rect(pos, [].concat(pos)); // copy a new object
        this.page.rects.push(newRect);
        this.drag.state = DRAG_RECT;
        this.drag.item = newRect;
    }

    textDragStart (pos) {
        for (let i=0; i< this.page.texts.length; i++) {
            if (this.page.texts[i].mouseWithin(pos)) {
                this.drag.state = DRAG_TEXT;
                this.drag.item = this.page.texts[i];
                this.page.texts[i].setAnchor(pos);
                return;
            }
        }
        this.drag.state = NOT_DRAGGING;
    }

    onMouseMove (event) {
        if (this.drag.state == NOT_DRAGGING ){
            this.drag.state = DRAG_NOTHING
            return;
        }

        const pos = this.getMouseRelativePosition(event);
        if ( pos.includes(0)) return; // the last ondrag before ondrag end will return negative value
        switch (this.drag.state){
            case DRAG_RECT:
                this.rectDragUpdate(pos);
                break;
            case DRAG_TEXT:
                this.textDragUpdate(pos);
                break;
            default:
        }
    }

    rectDragUpdate (pos) {
        this.drag.item.pos2 = [].concat(pos);
        this.refreshRectCanvas();
    }

    textDragUpdate (pos) {
        this.drag.item.anchorMoveTo(pos);
        this.refreshTextCanvas();
    }

    onMouseUp (event) {
        if (this.drag.state === NOT_DRAGGING) (this.onClick(event));
        if (this.drag.state === DRAG_TEXT) { this.drag.item.clearAnchor(); }
        this.drag = {state : ""};
    }

    render() {
        return (
            <div style={{position: "relative", overflow: "auto", width: "100%"}} >
                <canvas id="BaseCanvas"  style={{maxWidth: "100%", position: "absolute", zIndex: 1}}/>
                <canvas id="RectCanvas" style={{maxWidth: "100%", position: "absolute", zIndex: 2}}/>
                <canvas id="TextCanvas" draggable={false} style={{maxWidth: "100%", position: "absolute", zIndex: 3}}
                        onMouseUp={this.onMouseUp.bind(this)} onMouseMove={this.onMouseMove.bind(this)}
                        onMouseDown ={this.onMouseDown.bind(this)} />
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="TextSvg"  style={{position: "absolute", zIndex: 7}}
                     onMouseUp={this.onMouseUp.bind(this)} onMouseMove={this.onMouseMove.bind(this)}
                     onMouseDown ={this.onMouseDown.bind(this)}>

                </svg>
                <TextEditorComponent id="TextEditor" project={this.project} />
            </div>
        )
    }
}

class TextEditorComponent extends Component {
    constructor (props) {
        super(props);
        this.project = props.project;
        this.state = new Text([0,0]);
    }

    componentDidMount () {
        var fontSize = document.getElementById("fontSize");
        for (let i=0;i<100;i++) {
            let opt = document.createElement("option");
            opt.value=i;
            opt.innerHTML=i;
            fontSize.appendChild(opt);
        }
    }

    render() {
        return (
            <div style={{position:"absolute", backgroundColor:"gray", right: 15, top:10, zIndex:10}}>
                <label>Size</label><p/>
                <select id="fontSize" > </select><p/>

                <label>Content</label><p/>
                <textarea rows={10} cols={30} contentEditable={true}> fsafdsaf </textarea>
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
