import React, { Component } from 'react';

import './App.css';

const testimg = require("./testimg.jpeg");
const testtag = require("./logo.svg");
var min = (a, b) => {return a < b ? a : b;};
var max = (a, b) => {return a > b ? a : b;};


const VERTICALLY = 'vertivally';
const HORIZENTALLY = 'horizentally';

const DRAG_RECT = "DRAG_RECT";
const DRAG_TEXT = "DRAG_TEXT";

const KEYCODE_E = 69;
const KEYCODE_F = 70;
const KEYCODE_G = 71;
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
        this.text = "";
        this.width = 0;
        this.height = 0;

        // for dragging
        this.anchor = null;
        this.oriPos = null;

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
        this.oriPos = [].concat(this.pos);
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

        var page = new Page();
        var demo_img = new Image();
        demo_img.src = testimg;
        page.image = demo_img;

        this.page = page;

        // for interactive component
        this.drag = {};
        this.drag.state = "";
        this.drag.item = null;
        this.drag.startPos = null;
        this.keyPressed = {};
    }

    componentDidMount() {
        this.state.project.proxy.subscribe("SelectImg", this.switchToPage.bind(this));

        this.ctxes = {};
        this.ctxes.base = document.getElementById("BaseCanvas").getContext("2d");
        this.ctxes.rect = document.getElementById("RectCanvas").getContext("2d");
        this.ctxes.text = document.getElementById("TextCanvas").getContext("2d");

        this.loadDemoImage();
        this.registerListeners();
    }

    loadDemoImage() {
        if (this.page.image.complete) {
            this.updateCanvas();
        } else {
            this.page.image.onload = () => {this.resizeCanvases(); this.refreshAllCanvases();};
        }
    }

    registerListeners () {
        var model = this;
        document.body.addEventListener('keydown', function(event) {
            model.keyPressed[event.keyCode] = true;
        });

        document.body.addEventListener('keyup', function(event) {
            model.keyPressed[event.keyCode] = false;
        });
    }

    switchToPage (page) {
        this.page = page;
        this.resizeCanvases();
        this.refreshAllCanvases();
    }

    resizeCanvases () {
        for(var ctx in this.ctxes) {
            this.ctxes[ctx].canvas.width = this.page.image.width;
            this.ctxes[ctx].canvas.height = this.page.image.height;
        }
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
        var canvas = this.ctxes.rect.canvas;
        this.ctxes.rect.clearRect(0,0,canvas.width,canvas.height);
        this.page.rects.map((x) => {x.renderOnContext(this.ctxes.rect)});
    }

    refreshTextCanvas () {
        var canvas = this.ctxes.text.canvas;
        this.ctxes.text.clearRect(0,0,canvas.width,canvas.height);
        this.page.texts.map((x) => {x.renderOnContext(this.ctxes.text);});
    }

    getMouseRelativePosition(event) {
        return [event.nativeEvent.offsetX, event.nativeEvent.offsetY];
    }

    onClick(event) {
        var canvas = document.getElementById("TextCanvas");
        var ctx = canvas.getContext('2d');
    }

    onDragStart(event) {
        var pos = this.getMouseRelativePosition(event);

        if (this.keyPressed[KEYCODE_F]) this.rectDragStart(pos);;
        if (this.keyPressed[KEYCODE_E]) this.textDragStart(pos);;
    }

    rectDragStart (pos) {
        var newRect = new Rect(pos, [].concat(pos)); // copy a new object
        this.page.rects.push(newRect);
        this.drag.state = DRAG_RECT;
        this.drag.item = newRect;
    }

    textDragStart (text, pos) {
        for (var text of this.page.texts) {
            if (text.mouseWithin(pos)) {
                this.drag.state = DRAG_TEXT;
                this.drag.item = text;
                text.setAnchor(pos);
                break;
            }
        }
    }

    onDrag (event) {
        var pos = this.getMouseRelativePosition(event);
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
        if (pos.includes(0)){
            console.log([].concat(pos), this.drag.item.pos2);
        }

        this.refreshRectCanvas();
    }

    textDragUpdate (pos) {
        this.drag.item.anchorMoveTo(pos);
        this.refreshTextCanvas();
    }

    onDragEnd (event) {
        console.log(this.drag.item);
        if (this.drag.state == DRAG_TEXT) this.drag.item.clearAnchor();
        console.log(this.drag.item);
        this.drag = {};
    }

    render() {
        return (
            <div style={{position: "relative", overflow: "auto", width: "100%"}} >
                <canvas id="BaseCanvas" style={{maxWidth: "100%", position: "absolute", zIndex: 1}}></canvas>
                <canvas id="RectCanvas" style={{maxWidth: "100%", position: "absolute", zIndex: 2}}></canvas>
                <canvas id="TextCanvas" draggable="true" style={{maxWidth: "100%", position: "absolute", zIndex: 3}}
                        onDragEnd={this.onDragEnd.bind(this)} onDrag={this.onDrag.bind(this)}
                        onDragStart={this.onDragStart.bind(this)}></canvas>
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
            page.image.crossOrigin = "Anonymous";

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
                (page) => {
                    return ( <ThumbnailComponent page={page} key={page.key} proxy={this.state.proxy}></ThumbnailComponent>)
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

    onClick (event) {
        this.proxy.trigger("SelectImg", this.page);
    }

    render () {
        return(
            <img src={this.page.image.src} onClick={this.onClick.bind(this)}
                 style={{maxWidth:"100%", display:"block",float:"left"}}></img>
        )
    }
}
export default App;
