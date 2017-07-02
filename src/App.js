import React, { Component } from 'react';
import './App.css';

const testimg = require("./testimg.jpeg");

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
        this.x = pos[0];
        this.y = pos[1];
        this.text = "FUCK YOU MAN";
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
        let [x, y] = this.pos;
        return (x <= pos[0] && pos[0] <= x + this.width &&
                y <= pos[1] && pos[1] <= y + this.height);
    }

    setAnchor (pos) {
        this.anchor = [].concat(pos);
        this.oriPos = [].concat(this.pos);
        console.log("begin" + this.pos)
    }

    clearAnchor () {
        this.anchor = null;
        this.oriPos = null;
        console.log("end" + this.pos)
    }

    anchorMoveTo (pos) {
        console.log(""+this.pos);
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

        let count = 0;
        ctx.fillStyle = "black";
        ctx.textBaseline="hanging";
        let [x, y] = this.pos;
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
        let [x,y] = this.pos1;
        let [x1, y1] = this.pos2;
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

        let page = new Page();
        let demo_img = new Image();
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
        this.page.image.onload = () => {this.resizeCanvases(); this.refreshAllCanvases();};
    }

    registerListeners () {
        let model = this;
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
        for(let ctx in this.ctxes) {
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
        let canvas = this.ctxes.rect.canvas;
        this.ctxes.rect.clearRect(0,0,canvas.width,canvas.height);
        this.page.rects.map((x) => {x.renderOnContext(this.ctxes.rect)});
    }

    refreshTextCanvas () {
        let canvas = this.ctxes.text.canvas;
        this.ctxes.text.clearRect(0,0,canvas.width,canvas.height);
        this.page.texts.map((x) => {x.renderOnContext(this.ctxes.text);});
    }

    getMouseRelativePosition(event) {
        return [event.nativeEvent.offsetX, event.nativeEvent.offsetY];
    }

    onClick(event) {
        if (this.keyPressed[KEYCODE_E]) {
            let pos = this.getMouseRelativePosition(event);
            this.page.texts.push(new Text(pos));
            this.refreshTextCanvas();
        }
    }

    onDragStart(event) {
        let pos = this.getMouseRelativePosition(event);

        if (this.keyPressed[KEYCODE_F]) this.rectDragStart(pos);
        if (this.keyPressed[KEYCODE_E]) this.textDragStart(pos);
    }

    rectDragStart (pos) {
        let newRect = new Rect(pos, [].concat(pos)); // copy a new object
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
    }

    onDrag (event) {
        let pos = this.getMouseRelativePosition(event);
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

    onDragEnd () {
        if (this.drag.state === DRAG_TEXT) this.drag.item.clearAnchor();
        this.drag = {};
    }

    render() {
        return (
            <div style={{position: "relative", overflow: "auto", width: "100%"}} >
                <canvas id="BaseCanvas" style={{maxWidth: "100%", position: "absolute", zIndex: 1}}/>
                <canvas id="RectCanvas" style={{maxWidth: "100%", position: "absolute", zIndex: 2}}/>
                <canvas id="TextCanvas" draggable="true" style={{maxWidth: "100%", position: "absolute", zIndex: 3}}
                        onDragEnd={this.onDragEnd.bind(this)} onDrag={this.onDrag.bind(this)}
                        onDragStart={this.onDragStart.bind(this)} onClick={this.onClick.bind(this)}/>
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
        let files = event.target.files; //FileList object

        let loadImage = (event) => {

            let page = new Page();
            page.image = new Image();
            page.image.src = event.target.result;

            page.key = this.state.pages.length;
            page.image.crossOrigin = "Anonymous";

            this.state.pages.push(page);
            this.setState(this.state);
        };

        for(let file of files)
        {
            let picReader = new FileReader();
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
