import React, { Component } from 'react';

import './App.css';

const testimg = require("./testimg.jpeg");
const testtag = require("./logo.svg");
var min = (a, b) => {return a < b ? a : b;};
var max = (a, b) => {return a > b ? a : b;};
const VERTICALLY = 'vertivally';
const HORIZENTALLY = 'horizentally';

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
        this.bubbles = [];
        this.page = null;
    }
}
//
// ImageData.prototype.get = function (x, y) {
//     if (0 <= x < this.width && 0 <= y < this.height){
//         var pos = x * this.width + y;
//         return this.data.slice(pos, pos+4);
//     }
//     return [0, 0, 0, 0];
// }
//
// ImageData.prototype.set = function (x, y, color) {
//     if (0 <= x < this.width && 0 <= y < this.height) {
//         for (var i = 0; i < 4; i++) {
//             this.data[x * this.width + y + i] = color[i];
//         }
//         return true;
//     }
//     return false;
// }
//
// ImageData.prototype.drawLine = function(x1, y1, x2, y2, color){
//     // 1. judge k
//     // 2.vertical
//     // 3. horizental
//     // normally
// }
//
// ImageData.prototype.getImageData = function (x, y, width, height) {
//
// }

// add a update function to decrease refresh rate
class Bubble {
    constructor (boarder, base_color) {
        this.ctx = document.getElementById("BaseCanvas").getContext("2d");

        var [x, y, x1, y1] = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, -1, -1];
        for (var bx in boarder) {
            x = Math.min(bx, x);
            y = Math.min(y, boarder[bx].top);
            x1 = Math.max(bx, x1);
            y1 = Math.max(y1, boarder[bx].buttom);
        }

        this.x = x;
        this.y = y;
        this.width = x1 - x;
        this.height = y1 - y;
        this.boarder = boarder;
        this.ori_data = this.ctx.getImageData(this.x, this.y, this.width, this.height);
        this.base_color = "rgba(" +base_color[0] +","
                                    + base_color[1] +","
                                    + 122 +","
                                    + base_color[3] +")";

        this.direction = VERTICALLY;

        this.texts = [];
        this.fontSize = 48; // unit: px
        this.fontStyle = "serif";
    }


    showOrigin() {
        this.ctx.putImageData(this.ori_data, this.x, this.y);
    }

    hideOrigin() {
        this.refresh();
    }

    render() {
        this.refresh();
    }

    refresh () {
        // recover original text
        this.ctx.fillStyle = this.base_color;
        for (var x in this.boarder) {
            x = parseInt(x);
            var height = this.boarder[x].buttom - this.boarder[x].top;
            this.ctx.fillRect(x, this.boarder[x].top, 1, height);
        }

        // render text
        if (this.texts.length > 1) {
            this.ctx.font = this.fontSize + "px " + this.fontStyle;
            for(var text of this.texts) {
                this.ctx.fillText(text.text, this.x + text.x, this.y + text.y);
            }
        }
    }
}

class Text {
    constructor (bubble) {
        this.x = 0; // relative location to bubble
        this.y = 0;
        this.text = "";
    }
}

class Color {
    constructor(data) {
        this.r = data[0];
        this.g = data[1];
        this.b = data[2];
        this.a = data[3];
    }

    toImageData() {
        return {
            data : [this.r, this.g, this.b, this.a],
            width : 1,
            height : 1,
        }
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

              <div id="CanvasContainer" style={{display:"flex", width: "80%", backgroundColor:"#FF0000", flexGrow: 3, overflow:"scroll"}}>
                    <CanvasComponent  project={this.state}></CanvasComponent>
              </div>
          </div>
      </div>
    );
  }
}

class CanvasComponent extends Component {
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

        this.state = page;
    }

    setCanvasSize () {
        var div = document.getElementById("CanvasContainer");

        this.state.canvas_w = min(this.state.image.width, div.clientWidth);
        this.state.canvas_h = this.state.canvas_w*this.state.ratio;
    }


    updateCanvas () {
        this.setCanvasSize();
        var canvas = document.getElementById("BaseCanvas");
        var ctx = canvas.getContext("2d");

        canvas.height = this.state.canvas_h;
        canvas.width = this.state.canvas_w;
        ctx.drawImage(this.state.image, 0, 0, this.state.canvas_w, this.state.canvas_h);
    }

    componentDidMount ()  {
        this.state.project.proxy.subscribe("SelectImg", this.updateImage.bind(this));

        if (this.state.image.complete) {
            this.updateCanvas();
        } else {
            this.state.image.onload = ()=>this.updateCanvas();
        }
    }

    updateImage (src) {
        var state  = this.state;
        var image = new Image();
        image.src= src;
        image.crossOrigin = "Anonymous";
        state.image = image;
        state.ratio = image.height/image.width;
        this.setState(state);
        this.updateCanvas();
    }

    canvasOnClick (event) {
        var canvas = document.getElementById("BaseCanvas");
        var ctx = canvas.getContext('2d');
        var pos = this.getMouseRelativePosition(canvas, event);

        this.discoverBubble(pos);
    }

    discoverBubble (pos) {
        var seen = [];
        var unseen = [];
        var boarder  = {};// definition of boarder
        var canvas = document.getElementById("BaseCanvas");
        var ctx = canvas.getContext('2d');
        var ori_color = ctx.getImageData(pos[0], pos[1], 1, 1).data;

        unseen.push(pos);
        while (unseen.length >= 1) {
            var this_pos = unseen.pop(0);
            seen.push(this_pos.toString());
            var [x, y] = this_pos;

            var this_color = ctx.getImageData(x, y, 1, 1).data;
            if (distance(this_color, ori_color) < 3) {
                if (boarder[x] == null) {
                    boarder[x] = {top: y, buttom: y};
                } else {
                    if (boarder[x].top > y) boarder[x].top = y;
                    if (boarder[x].buttom < y) boarder[x].buttom = y;
                }

                if(!seen.includes([x-1, y].toString())) {
                    unseen.push([x-1, y]);
                }
                if(!seen.includes([x+1, y].toString())) {
                    unseen.push([x+1, y]);
                }
                if(!seen.includes([x, y-1].toString())) {
                    unseen.push([x, y-1]);
                }
                if(!seen.includes([x, y+1].toString())){
                    unseen.push([x, y+1]);
                }
            }

        }

        var newBubble = new Bubble(boarder, ori_color);
        newBubble.render();


        var state = this.state;
        state.bubbles.push(newBubble);
        this.setState(state);
    }

    getMouseRelativePosition(canvas, event) {
        return [event.pageX - canvas.offsetLeft, event.pageY];
    }


    renderBubbles() {
        return this.state.bubbles.map(
            (bubble) => {return <BubbleComponent key={bubble.x+','+bubble.y} x={bubble.x+bubble.width} y={bubble.y}></BubbleComponent>}
        )
    }

    render() {
        return(
            <div style={{overflow: "auto", width: "100%"}}>
                <div style={{}}>
                    <canvas id="BaseCanvas" onClick={this.canvasOnClick.bind(this)} style={{maxWidth: "100%"}} ></canvas>
                    {this.renderBubbles()}
                </div>

            </div>
        )
    }
}

class BubbleComponent extends Component {
    constructor (props) {
        super(props);
        this.state = props
    }

    render () {
        return (
                <img style={{left:this.state.x+"px", top:this.state.y+"px", zIndex:999}} src={"https://www.gravatar.com/avatar/a007be5a61f6aa8f3e85ae2fc18dd66e?s=32&d=identicon&r=PG"} alt={""}/>
            );
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


/*
project
    default_font default_size
    page
        image
        bubbles
            x,y,width,height,
            oridata
            texts
                x,y,font, size
 */