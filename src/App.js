import React, { Component } from 'react';

import './App.css';

const testimg = require("./testimg.jpeg");
const testtag = require("./logo.svg");
var min = (a, b) => {return a < b ? a : b;};
var max = (a, b) => {return a > b ? a : b;};


const VERTICALLY = 'vertivally';
const HORIZENTALLY = 'horizentally';

const DRAG_TO_COVER = "DRAG_TO_COVER";
const DRAG_TEXT = "DRAG_TEXT";

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
    constructor (){
        this.image = null;
        this.rects = []; // rects that cover original texts
        this.texts = [];
        this.page = null;
    }
}

class Text {
    constructor (pos) {
        this.pos = pos;
        this.text = "";
        this.width = 0;
        this.height = 0;

        // for dragging
        this.anchor = null;
        this,oriPos = null;

        this.fontSize = 15;
        this.fontStyle = "serif";
        this.lineGap = 3;
    }

    mouseWithin (pos) {
        return (this.x <= pos[0] <= this.x + this.width) &
                (this.y <= pos[1] <= this.y + this.height);
    }

    setAnchor (pos) {
        this.anchor = pos;
        this.oriPos = this.pos.copy();
    }

    clearAnchor () {
        this.anchor = null;
        this.oriPos = this.pos;
    }

    anchorMoveTo (pos) {
        this.pos[0] = this.oriPos[0] + pos[0] - this.anchor[0];
        this.pos[1] = this.oriPos[1] + pos[1] - this.anchor[1];
    }

    getFont () {
        return this.fontSize + "px " + this.fontStyle;
    }

    renderOnContext (ctx) {
        ctx.font = this.getFont();
        this.width = 0;
        this.height = 0;

        var count = 0;
        for (var text of this.text.split("\n")) {
            this.width = Math.max(this.width, ctx.measureText(text).width);
            this.height = this.height + this.lineGap + this.fontSize;
            ctx.fillText(text, this.x, this.y + count * (this.lineGap + this.fontSize));
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
        var [x,y] = this.pos1;
        var [x1, y1] = this.pos2;
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
        super(props)
        this.state = new Project();
    }

  render() {
    return (
      <div className="App">
          <div style={{display: "flex", width: "100%", height: "100%", position: "absolute"}}>
              <GalleryComponent project={this.state}></GalleryComponent>
              <div id="EditorContainer" style={{display:"flex", width: "80%", backgroundColor:"#FF0000", flexGrow: 3, overflow:"scroll"}}>
                  <InteractiveEditor project={this.state}></InteractiveEditor>
              </div>
          </div>
      </div>
    );
  }
}

class InteractiveEditor extends Component {
    constructor(props) {
        super(props);

        var page = new Page();
        page.project = props.project;

        var demo_img = new Image();
        demo_img.src = testimg;
        page.image = demo_img;

        // for interactive component
        page.canvas_w = 400;
        page.canvas_h = 400;

        this.drag = {};
        this.drag.state = "";
        this.drag.item = null;
        this.drag.startPos = null;

        this.state = page;
    }

    setCanvasSize() {
        var div = document.getElementById("EditorContainer");

        this.state.canvas_w = min(this.state.image.width, div.clientWidth);
        this.state.canvas_h = this.state.canvas_w * this.state.ratio;
    }


    updateCanvas() {
        this.setCanvasSize();
        var baseCanvas = document.getElementById("BaseCanvas");
        baseCanvas.height = this.state.canvas_h;
        baseCanvas.width = this.state.canvas_w;
        var ctx = baseCanvas.getContext("2d");

        ctx.drawImage(this.state.image, 0, 0, this.state.canvas_w, this.state.canvas_h);


        var coverCanvas = document.getElementById("CoverCanvas");
        coverCanvas.height = this.state.canvas_h;
        coverCanvas.width = this.state.canvas_w;
        var textCanvas = document.getElementById("TextCanvas");
        textCanvas.height = this.state.canvas_h;
        textCanvas.width = this.state.canvas_w;
    }

    componentDidMount() {
        this.state.project.proxy.subscribe("SelectImg", this.updateImage.bind(this));

        if (this.state.image.complete) {
            this.updateCanvas();
        } else {
            this.state.image.onload = () => this.updateCanvas();
        }
    }

    updateImage(src) {
        var state = this.state;
        var image = new Image();
        image.src = src;
        image.crossOrigin = "Anonymous";
        state.image = image;
        state.ratio = image.height / image.width;
        this.setState(state);
        this.updateCanvas();
    }

    getMouseRelativePosition(canvas, event) {
        return [event.pageX - canvas.offsetLeft, event.pageY];
    }

    onClick(event) {
        var canvas = document.getElementById("TextCanvas");
        var ctx = canvas.getContext('2d');
    }

    rectDragStart (pos) {
        var newRect = new Rect(pos, pos.copy());
        this.state.rects.push(newRect);
        this.drag.state = DRAG_TO_COVER;
        this.drag.item = newRect;
    }

    textDragStart (text, pos) {
        this.drag.state = DRAG_TEXT;
        this.drag.item = text;
        text.setAnchor(pos);
    }

    onDragStart(event) {
        var canvas = document.getElementById("TextCanvas");
        var pos = this.getMouseRelativePosition(canvas, event);
        if (event.shift) {  //drag to draw rect
            this.rectDragStart(pos);
        } else if (event.alt) {  //drag text
            for (var text of this.state.texts) {
                if (text.mouseWithin(pos)) {
                    this.textDragStart(text, pos);
                    break;
                }
            }
        }
    }

    rectDragUpdate (pos) {
        this.drag.item.pos2 = pos;
        this.refreshRectCanvas();
    }

    rectDragUpdate (pos) {
        this.drag.item.anchorMoveTo(pos);
        this.refreshTextCanvas();
    }

    onDrag (event) {
        var canvas = document.getElementById("TextCanvas");
        var pos = this.getMouseRelativePosition(canvas, event);
        switch (this.state.drag.state){
            case DRAG_TO_COVER:
                this.rectDragUpdate(pos);
                break;
            case DRAG_TEXT:
                this.textDragUpdate(pos);
                break;
            default:
        }
    }

    onDragEnd (event) {
        if (this.drag.state == DRAG_TEXT) this.drag.item.clearAnchor();
        this.drag = {};
    }

    refreshRectCanvas() {
        var canvas = document.getElementById("RectCanvas");
        var ctx = canvas.getContext("2d");
        ctx.clear();
        this.state.rects.map((x) => {x.renderOnContext(ctx);});
    }

    refreshTextCanvas() {
        var canvas = document.getElementById("TextCanvas");
        var ctx = canvas.getContext("2d");
        ctx.clear();
        this.state.texts.map((x) => {x.renderOnContext(ctx);});
    }

    render() {
        return (
            <div style={{position: "relative", overflow: "auto", width: "100%"}}>
                <canvas id="BaseCanvas" style={{maxWidth: "100%", position: "absolute", zIndex: 1}}></canvas>
                <canvas id="CoverCanvas" style={{maxWidth: "100%", position: "absolute", zIndex: 2}}></canvas>
                <canvas id="TextCanvas" draggable="true" style={{maxWidth: "100%", position: "absolute", zIndex: 3}}
                        onDragEnd={this.onDragEnd} onDrag={this.onDrag} onDragStart={this.onDrag}
                        onClick={this.onClick}></canvas>
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
        var files = event.target.files; //FileList object

        var loadImage = (event) => {

            var page = new Page();
            page.image = new Image();
            page.image.src = event.target.result;
            page.key = this.state.pages.length;

            this.state.pages.push(page);
            this.setState(this.state);
        };

        for(var file of files)
        {
            var picReader = new FileReader();
            picReader.addEventListener("load", loadImage.bind(this));
            picReader.readAsDataURL(file);
        }
    }

    renderThumbnails() {
        return (
            this.state.pages.map(
                (x) => {
                    return ( <ThumbnailComponent src={x.image.src} key={x.key} proxy={this.state.proxy}></ThumbnailComponent>)
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
        this.state = props;
    }

    onClick (event) {
        this.state.proxy.trigger("SelectImg", this.state.src);
    }

    render () {
        return(
            <img onClick={this.onClick.bind(this)} alt={this.state.key} src={this.state.src} style={{maxWidth:"100%", display:"block",float:"left"}}></img>
        )
    }
}
export default App;
