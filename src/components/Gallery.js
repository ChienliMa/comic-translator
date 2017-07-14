import React, {Component} from 'react';
import ThumbnailComponent from './Thumbnail'
import * as JSZip from 'jszip';
import  * as FileSaver from 'file-saver';

import {Page} from '../utils';



class GalleryComponent extends Component {
    constructor(props) {
        super(props);
        this.project = props.project;
    }

    uploadImages(event) {
        const files = event.target.files; //FileList object

        for(let file of files)
        {
            const picReader = new FileReader();

            picReader.onload = ((filename) => // bind filename to onload funciton using closure
            {
                return ((event) => {
                    const imgSrc = event.target.result;
                    const key = this.project.pages.length;
                    const page = new Page(filename, imgSrc, key);

                    this.project.pages.push(page);
                    this.forceUpdate();
                })
            })(file.name);

            picReader.readAsDataURL(file);
        }
    }

    exportMultiplePages () {
        this.project.proxy.trigger("ExportFile", {});
        var zip = new JSZip();
        var img = zip.folder("images");
        let countDown = this.project.pages.length;
        for (let page of this.project.pages) {
            let svgImage = new Image();
            svgImage.src = page.svgSrc;

            svgImage.onload = ()=>{
                let outputCanvas = document.createElement("canvas");
                outputCanvas.width = page.image.width;
                outputCanvas.height = page.image.height;

                let outputCtx = outputCanvas.getContext("2d");

                outputCtx.drawImage(page.image, 0, 0);
                page.rects.map((rect)=>rect.renderOnContext(outputCtx));
                outputCtx.drawImage(svgImage, 0, 0)

                let savable = new Image();
                savable.src = outputCanvas.toDataURL();
                img.file(page.filename, savable.src.substr(savable.src.indexOf(',')+1), {base64: true});

                countDown  = countDown - 1;
                if (countDown === 0) {
                    zip.generateAsync({type:"blob"})
                        .then(function(content) {
                            FileSaver.saveAs(content, "download.zip");
                        });
                }
            }
        }
    }

    renderThumbnails() {
        return (
            this.project.pages.map(
                (page) => {
                    return (
                        <div>
                            <ThumbnailComponent page={page} key={page.key} proxy={this.project.proxy}/>
                            <label>{page.filename}</label>
                        </div>)
                }
            )
        )
    }

    render() {
        return (
            <div className="preview-bar">
                {this.renderThumbnails()}
                <label for="">
                    <p className="button">添加图片</p>
                    <input id="fileId2" type="file" multiple="multiple" onChange={(e)=> this.uploadImages(e)} className="hidden"/>
                </label>

                <label for="">
                    <button className="button" onClick={this.exportMultiplePages.bind(this)}>导出全部图片</button>
                </label>
            </div>
        )
    }
}

export default GalleryComponent;
