const fs            = require("fs");
const EventProxy    = require("EventProxy");
const exportLayer   = require("layout")("binary-tree");
const {dialog}      = require('electron').remote;
const template      = require("art-template");
const path          = require("path");
const ConfigFile    = path.join(__dirname, "js/config.json");

template.config("base", path.join(__dirname, "tpl"));
template.config("extname", ".tpl");

class BitMapFont {
    constructor () {
        this._data = {};
        this._fontSize = null;
        this._readFilesCompleted = false;
        this._selectedLetter = null;
        this._config = {
            "spacing" : 5,
            "font_type" : "xml"
        }

        this.fontInfo = $(".footer .info");
        this.uploader = $(".uploader");
        this.fontList = $(".font-list ul");
        this.btnPublish = $(".publish");
        this.btnDeletAll = $(".deleteall");
        this.container = $(".container");
        this.spacingInput = $(".spacing");
        this.fontType = $("input:radio[name='font_type']");

        this.init();
    }
    init () {
        this.setup();
        this.bindEvent();
    }
    setup () {
        if(fs.existsSync(ConfigFile)){
            let config = fs.readFileSync(ConfigFile).toString();
            if(config){
                this._config = $.extend(this._config, JSON.parse(config));
            }
        }

        $("input:radio[value='" + this._config.font_type + "']").attr("checked", true);
        $(".spacing").val(this._config.spacing);
    }
    bindEvent () {
        let self = this;

        $(document).on({
            dragleave: function(e) {
                e.preventDefault();
            },
            drop: function(e) {
                e.preventDefault();
            },
            dragenter: function(e) {
                e.preventDefault();
            },
            dragover: function(e) {
                e.preventDefault();
            },
            paste: function(e) {
                e.preventDefault();
            }
        });

        this.spacingInput.on("blur", function () {
            console.log($(this).val());
            var val = $(this).val();
            
            val = val ? val : self._config.spacing;
            val = val | 0;
            val = val < 0 ? 0 : val;

            self._config.spacing = val;

            $(this).val(val);
        });

        this.fontType.on("click", function () {
            self._config.font_type = $(this).val();
        });

        this.btnDeletAll.on("click", function () {
            self.fontList.empty();
            self.container.removeClass("finish");
            self.fontInfo.html("字号：--");

            self._data = {};
            self._fontSize = null;
            self._readFilesCompleted = false;
        });

        this.fontList.on("click", ".btn.del", function () {
            let $li     = $(this).closest("li");
            let letter  = $li.attr("data-letter");

            $li.remove();
            delete self._data[letter];

            if(Object.keys(self._data).length == 0){
                self.container.removeClass("finish");
            }
        });

        this.fontList.on("click"/*或者focus*/, ".letter", function () {
            this._selectedLetter = $(this).text();

            var range = document.createRange();
                range.selectNodeContents($(this)[0]);

            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        });
        this.fontList.on("blur", ".letter", function () {
            window.getSelection().removeAllRanges();
            this._selectedLetter = null;
        });

        this.fontList.on("input", ".letter", function () {
            var letter = $(this).text();

            letter = letter.replace(/ /g, "");
            letter = letter.substr(0, 1);

            if(letter == ""){
                $(this).text(this._selectedLetter);
                return;
            }

            if(self._data[letter]){
                layer.alert("字符：" + letter + "已经被占用。", {
                    skin: 'layui-layer-molv',
                    closeBtn: 0
                });

                $(this).text(this._selectedLetter);
                return;
            }

            $(this).text(letter);
            if(!self._data[letter]){
                self._data[letter] = self._data[this._selectedLetter];
                self._data[letter].id = letter.charCodeAt(0);
                delete self._data[this._selectedLetter];

                $(this).trigger("blur");
            }
        });

        this.uploader.on("drop", (e) => {
            let files = e.originalEvent.dataTransfer.files;
            let ep    = new EventProxy();

            ep.after("read_img", files.length, function () {
                self._readFilesCompleted = true;
                
                self.fontInfo.html("字号：" + self._fontSize);
                self.container.addClass("finish");
            })

            for(let i = 0; i < files.length; i++){
                ((file) => {
                    let letter = file.name[0];
                    let reader = new FileReader();

                    reader.onload = function (e) {
                        self.onFileRead(self, letter, ep, e);
                    }
                    reader.readAsDataURL(file);
                })(files[i]);
            }
        });
        this.btnPublish.on("click", () => {
            if(!this._readFilesCompleted){ return; }
            if(Object.keys(self._data).length == 0){ return; }

            let filePath = dialog.showSaveDialog();

            if(!filePath){ return; }

            this.publishFont(filePath, this._config.font_type, this._config.spacing);
        });
    }
    onFileRead (self, letter, ep, e) {
        let img = new Image();

        img.src = e.target.result;
        img.onload = function (e) {
            let $info = null;

            if(self._data[letter]){
                $info = self._data[letter].$li;
                $info.find(".img").css("background-image", "url(" + img.src + ")");
            }else{
                $info = $(template("font_list", {src : this.src, letter : letter}));
                $info.appendTo(self.fontList);
            }

            self._data[letter] = {
                $li     : $info,
                id      : letter.charCodeAt(0),
                img     : this,
                width   : this.width,
                height  : this.height
            }

            self._fontSize = Math.max(self._fontSize, this.height);
            ep.emit("read_img");
        }
    }
    getFontData (fileName, fontType, spacing) {
        let data    = this._data,
            _size   = this._fontSize,
            res     = {},
            items   = null,
            canvas  = document.createElement("canvas"),
            ctx     = canvas.getContext("2d"),
            fntData = null;

        for(let i in data){
            exportLayer.addItem({'width': data[i].width + spacing, 'height': _size + spacing, 'meta': i})
        }

        res = exportLayer.export();
        exportLayer.items = [];

        items         = res.items;
        canvas.width  = res.width - spacing;
        canvas.height = res.height - spacing;

        for(let i in items){
            let origin = data[items[i].meta];

            items[i].id  = origin.id;
            items[i].img = origin.img;

            ctx.drawImage(items[i].img, items[i].x, items[i].y + ((_size - origin.height) / 2 | 0));
        }

        fntData = {
            fontSize: this._fontSize,
            width   : res.width,
            height  : res.height,
            fileName: fileName,
            spacing : spacing,
            items   : items
        };

        return {
            fnt : template("font_" + fontType, fntData),
            png : new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), 'base64')
        }
    }
    publishFont (filePath, fontType, spacing){
        var alertIndex = layer.load(0, {shade : 0.3});

        let dirName  = path.dirname(filePath),
            fileName = path.basename(filePath).replace(path.extname(filePath), ""),
            fontData = this.getFontData(fileName, fontType, spacing);

        fs.writeFileSync(path.join(dirName, fileName + ".fnt"), fontData.fnt);
        fs.writeFileSync(path.join(dirName, fileName + ".png"), fontData.png);
        fs.writeFileSync(ConfigFile, JSON.stringify(this._config));

        layer.close(alertIndex);
        layer.alert('字体发布成功！', {
            icon: 1,
            skin: 'layui-layer-molv',
            closeBtn: 0
        });
    }
}

app = new BitMapFont();