import React, {Component} from 'react';
import TextComponent from './Text'
import TextEditorComponent from './TextEditor'

import {Project, Page, Rect, Text, EventProxy} from '../utils'

import CONST from '../constants';

class InteractiveCanvasComponent extends Component {
    constructor(props) {
        super(props);

        this.project = props.project;

        const page = new Page();

        this.state = page;
        // for interactive component
        this.drag = {};
        this.drag.state = "";
        this.drag.item = null;
        this.drag.startPos = null;

        this.keyPressed = {};
        this.keyPressed[CONST.KEYCODE_ALT] = false;

        this.hidden = false;

    }

    componentDidMount() {
        this.project.proxy.subscribe("SelectImg", this.bindToPage.bind(this));
        this.project.proxy.subscribe("ExportFile", this.saveSvgSrc.bind(this));

        this.ctxes = {};
        this.ctxes.base = document.getElementById("BaseCanvas").getContext("2d");
        this.ctxes.rect = document.getElementById("RectCanvas").getContext("2d");

        this.textSvg = document.getElementById("TextSvg");


        this.loadDemoImage();
        this.registerListeners();
        this.refreshAllCanvases();
    }

    componentWillMount () {
        const model = this;
        document.body.removeEventListener('keydown', model.onKeyDown.bind(model));
        document.body.removeEventListener('keyup', model.onKeyUp.bind(model));
        this.project.proxy.clearSubscribes("SelectImg");
    }

    loadDemoImage() {
        this.state.image.onload = () => {this.refreshAllCanvases();};
    }

    registerListeners () {
        const model = this;
        document.body.addEventListener('keydown', model.onKeyDown.bind(model));
        document.body.addEventListener('keyup', model.onKeyUp.bind(model));
    }

    bindToPage (page) {
        this.state.svgSrc = this.getSvgSrc();
        this.state = page;
        this.forceUpdate(()=>{
            this.refreshAllCanvases();
        });
    }

    onKeyDown (event) {
        this.keyPressed[event.keyCode] = true;
        this.keyPressed[CONST.KEYCODE_ALT] = event.altKey;

        if (event.keyCode === CONST.KEYCODE_W && !this.hidden) {
            this.hidden = true;
            this.clearRectCanvas();
            this.textSvg.setAttribute("visibility","hidden");
        }
    }

    onKeyUp (event) {
        this.keyPressed[event.keyCode] = false;
        this.keyPressed[CONST.KEYCODE_ALT] = event.altKey;

        if (event.keyCode == CONST.KEYCODE_S && event.altKey) {
            this.exportSingleImage();
        }

        if (event.keyCode === CONST.KEYCODE_W && this.hidden) {
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
        this.resizeCanvases();
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

    onDoubleClick (event) {
        const pos = this.getScaledPosition(event);
        let text = new Text(pos);
        this.state.texts.push(text);
        this.forceUpdate();
    }

    onMouseDown(event) {
        const pos = this.getScaledPosition(event);
        if (this.keyPressed[CONST.KEYCODE_F]) {
            this.rectDragStart(pos);
        }
    }

    rectDragStart (pos) {
        const newRect = new Rect(pos, [].concat(pos)); // copy a new object
        this.state.rects.push(newRect);
        this.drag.state = CONST.DRAG_RECT;
        this.drag.item = newRect;
    }

    onMouseMove (event) {
        if (this.drag.state == CONST.NOT_DRAGGING ){
            this.drag.state = CONST.DRAG_NOTHING
            return;
        }

        const pos = this.getScaledPosition(event);
        switch (this.drag.state){
            case CONST.DRAG_RECT:
                this.rectDragUpdate(pos);
                break;
            default:
        }
    }

    rectDragUpdate (pos) {
        this.drag.item.pos2 = [].concat(pos);
        this.refreshRectCanvas();
    }

    onMouseUp () {
        this.drag = {state : ""};
    }

    saveSvgSrc () {
        this.state.svgSrc = this.getSvgSrc();
    }

    getSvgSrc () {
        let svgString = new XMLSerializer().serializeToString(this.textSvg);
        return 'data:image/svg+xml;base64,'+ window.btoa(unescape(encodeURIComponent(svgString)));
    }

    exportSingleImage () {
        let outputCanvas = document.createElement("canvas");
        let outputCtx = outputCanvas.getContext("2d");

        outputCanvas.width = this.state.image.width;
        outputCanvas.height = this.state.image.height;


        let svgImage = new Image();
        svgImage.src = this.getSvgSrc()

        svgImage.onload = ()=>{
            outputCtx.drawImage(this.ctxes.base.canvas, 0, 0);
            outputCtx.drawImage(this.ctxes.rect.canvas, 0, 0);
            outputCtx.drawImage(svgImage, 0, 0);

            let dt = outputCanvas.toDataURL('image/png');
            /* Change MIME type to trick the browser to downlaod the file instead of displaying it */
            dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
            /* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
            dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition: attachment; filename=foobar.png ');

            let link = document.createElement('a');
            link.href = dt;
            link.download = this.state.filename;
            link.click();
        };
    }

    render() {
        let texts = [];
        this.state.texts.forEach((text, index) =>{
            texts.push(<TextComponent keyPressed={this.keyPressed} proxy={this.project.proxy}
                                      text={text} key={this.state.key + "," + index}/>)
        });

        return (
            <div className="editor-div">
                <canvas id="BaseCanvas" className="canvas-base" style={{zIndex: 1}}/>
                <canvas id="RectCanvas" className="canvas-rect" style={{zIndex: 2}}/>
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
                     id="TextSvg" className="canvas-text" style={{zIndex: 7}}
                     onMouseUp={this.onMouseUp.bind(this)} onMouseMove={this.onMouseMove.bind(this)}
                     onMouseDown ={this.onMouseDown.bind(this)} onDoubleClick={this.onDoubleClick.bind(this)}
                     >
                    {texts}
                </svg>
                <TextEditorComponent id="TextEditor" project={this.project} />
            </div>
        )
    }
}

export default InteractiveCanvasComponent;