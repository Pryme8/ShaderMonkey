
MNKY = function(){
	
	

	
	this.editors ={
		x : CodeMirror(document.getElementById('x-shade'), {
  		value: MNKY.EXAMPLES.x.basic,
  		mode: 'x-shader/x-vertex',
		lineNumbers: true,
		viewportMargin: Infinity,
		matchBrackets: true,
      	autoCloseBrackets: true,
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
        showCursorWhenSelecting: true,
        dragDrop: false,
        indentUnit: 4,
        lineWrapping: true,
		theme: 'rubyblue'
			}),
		 	frag : CodeMirror(document.getElementById('frag-shade'), {
  				value: MNKY.EXAMPLES.frag.basic,
  				 mode: 'x-shader/x-fragment',
				 		lineNumbers: true,
						viewportMargin: Infinity,
						matchBrackets: true,
      					autoCloseBrackets: true,
        				extraKeys: { 'Ctrl-Space': 'autocomplete' },
        				showCursorWhenSelecting: true,
        				dragDrop: false,
        				indentUnit: 4,
        				lineWrapping: true,
        				autofocus: true,
						theme: 'rubyblue'
			}),
		scene : CodeMirror(document.getElementById('scene-editor'), {
  				 value: MNKY.EXAMPLES.scene.basic,
  				 mode: 'javascript',
				 		lineNumbers: true,
						viewportMargin: Infinity,
						matchBrackets: true,
      					autoCloseBrackets: true,
        				extraKeys: { 'Ctrl-Space': 'autocomplete' },
        				showCursorWhenSelecting: true,
        				dragDrop: false,
        				indentUnit: 4,
        				lineWrapping: true,
        				theme: 'erlang-dark'
		}),
		} //<--Editors
		
		this.helpers ={
		x : new MNKY.HELPERS(this.editors.x),
		frag : new MNKY.HELPERS(this.editors.frag),
		scene : new MNKY.HELPERS(this.editors.scene)
		} 

};



MNKY.EXAMPLES = {
	x:{
		basic:	"precision highp float;\n"+
				"\n"+
				"// Attributes\n"+
				"attribute vec3 position;\n"+
				"attribute vec2 uv;\n"+
				"\n"+
				"// Uniforms\n"+
				"uniform mat4 worldViewProjection;\n"+
				"\n"+
				"// Varying\n"+
				"varying vec2 vUV;\n"+
				"\n"+
				"void main(void) {\n"+
    			"gl_Position = worldViewProjection * vec4(position, 1.0);\n"+
				"\n"+
    			"vUV = uv;\n"+
				"}",
		},
	frag:{
		basic: "precision highp float;\n"+
			   "\n"+
				"varying vec2 vUV;\n"+
				"\n"+
				"uniform sampler2D textureSampler;\n"+
				"\n"+
				"void main(void) {\n"+
    			"gl_FragColor = texture2D(textureSampler, vUV);\n"+
				"}\n"
			},
	scene: { 
		basic : 
		    'camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 20, BABYLON.Vector3.Zero(), scene);\n'+
            'camera.minZ = 0.1;\n'+
			'var lPos = new BABYLON.Vector3(50, 0, -20);\n'+
			'var light = new BABYLON.SpotLight("MainLight",lPos, lPos.scale(-1).normalize() , 0.92, 3, scene);\n'+
			'light.intensity = 0.65;\n'+
			'light.diffuse = new BABYLON.Color3(0, 0, 0);\n'+
			'light.specular = new BABYLON.Color3(1, 1, 1);\n'+
			'\n'+			
			'var shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, {\n'+
            'vertexElement: "controlVertex",\n'+
            'fragmentElement: "controlPixel",\n'+
       		'},\n'+
            '{\n'+
            '   attributes: ["position", "normal", "uv"],\n'+
            '   uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]\n'+
            '});\n'+
			'\n'+	
			'shaderMaterial.setFloat("time", 0);\n'+
        	'shaderMaterial.setVector3("cameraPosition", BABYLON.Vector3.Zero());\n'+
            'shaderMaterial.backFaceCulling = false;\n'+
			'\n'+
		    'var mesh =  BABYLON.MeshBuilder.CreateBox("box", {size: 10}, scene);\n'+
			'mesh = this.shaderMaterial;\n'	
		}
};



// Return all pattern matches with captured groups
RegExp.prototype.execAll = function(string) {
    var match = null;
    var matches = [];
    while (match = this.exec(string)) {
        var matchArray = [];
        for (var i in match) {
            if (parseInt(i) == i) {
                matchArray.push(match[i]);
            }
        }
        matchArray.index = match.index;
        matches.push(matchArray);
    }
    return matches;
};

MNKY.HELPERS = function(editor){
	this.editor = editor;
	var style = window.getComputedStyle(editor.getWrapperElement(), null);
    var bgColor = style.background !== '' ? style.background : style.backgroundColor || 'rgb(0,0,0,0.5)';
    var fgColor = style.color;
	
	this.properties = {
            bgColor: bgColor,
            fnColor: fgColor,
            dimColor: 'rgb(127, 127, 127)',
            selColor: 'rgb(40, 168, 107)',
            link_button: true
        };
	
	var wrapper = editor.getWrapperElement();
	
	 wrapper.addEventListener('mouseup', function(event) {
            this.main.visualDebugger.clean(event);

            // bail out if we were doing a selection and not a click
            if (this.main.editor.somethingSelected()) {
                return;
            }

            var cursor = this.main.editor.getCursor(true);

            // see if there is a match on the cursor click
            var match = this.getMatch(cursor);
            var token = this.main.editor.getTokenAt(cursor);
            if (match) {
                // Toggles the trackpad to be off if it's already present.
                if (this.activeModal && this.activeModal.isVisible) {
                    this.activeModal.removeModal();
                    return;
                }

                if (match.type === 'color') {
                    this.activeModal = new ColorPicker(match.string, this.properties);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed', function(color) {
                        var newColor = color.getString('vec');
                        var start = { line: cursor.line, ch: match.start };
                        var end = { line: cursor.line, ch: match.end };
                        match.end = match.start + newColor.length;
                        this.main.editor.replaceRange(newColor, start, end);
                    	});

                    this.activeModal.on('link_button', function(color) {
                        this.activeModal = new Vec3Picker(color.getString('vec'), this.properties);
                        this.activeModal.showAt(this.main.editor);
                        this.activeModal.on('changed', function(dir) {
                            var newDir = dir.getString('vec3');
                            var start = { line: cursor.line, ch: match.start };
                            var end = { line: cursor.line, ch: match.end };
                            match.end = match.start + newDir.length;
                            this.main.editor.replaceRange(newDir, start, end);
                        	});
					});
					
					
					
                }
                if (match.type === 'vec3') {
                    this.activeModal = new Vec3Picker(match.string, this.properties);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed', function(dir) {
                        var newDir = dir.getString('vec3');
                        var start = { line: cursor.line, ch: match.start };
                        var end = { line: cursor.line, ch: match.end };
                        match.end = match.start + newDir.length;
                        this.main.editor.replaceRange(newDir, start, end);
                    });
                }
                else if (match.type === 'vec2') {
                    this.activeModal = new Vec2Picker(match.string, this.properties);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed', function(pos) {
                        var newpos = pos.getString();
                        var start = { line: cursor.line, ch: match.start };
                        var end = { line: cursor.line, ch: match.end };
                        match.end = match.start + newpos.length;
                        this.main.editor.replaceRange(newpos, start, end);
                    });
                }
                else if (match.type === 'number') {
                    this.activeModal = new FloatPicker(match.string, this.properties);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed', function(number) {
                        var newNumber = number.getString();
                        var start = { line: cursor.line, ch: match.start };
                        var end = { line: cursor.line, ch: match.end };
                        match.end = match.start + newNumber.length;
                        this.main.editor.replaceRange(newNumber, start, end);
                    });
                }
            }
            else if (this.main.options.tooltips && (token.type === 'builtin' || token.type === 'variable-3')) {
                var html = '<p>Learn more about: <a href="https://thebookofshaders.com/glossary/?search=' + token.string + '" target="_blank">' + token.string + '</a></p>';
                this.activeModal = new Modal('ge_tooltip', { innerHTML: html });
                this.activeModal.showAt(this.main.editor);
            }
            else if (token.type === 'variable') {
                if (this.main.visualDebugger) {
                    this.main.visualDebugger.iluminate(token.string);
                }
            }
        });

function getMatch (cursor) {
        var types = ['color', 'vec3' ,'vec2', 'number'];
        var rta;
        for (var i in types) {
            rta = this.getTypeMatch(cursor, types[i]);
            if (rta) {
                return rta;
            }
        }
        return;
    }

function getTypeMatch (cursor, type) {
        if (!type) {
            return;
        }
        var re;
        switch(type.toLowerCase()) {
            case 'color':
                re = /vec[3|4]\([\d|.|,\s]*\)/g;
                break;
            case 'vec3':
                re = /vec3\([-|\d|.|,\s]*\)/g;
                break;
            case 'vec2':
                re = /vec2\([-|\d|.|,\s]*\)/g;
                break;
            case 'number':
                re = /[-]?\d+\.\d+|\d+\.|\.\d+/g;
                break;
            default:
                console.error('invalid match selection');
                return;
        }
        var line = this.main.editor.getLine(cursor.line);
        var matches = re.execAll(line);

        if (matches) {
            for (var i = 0; i < matches.length; i++) {
                var val = matches[i][0];
                var len = val.length;
                var start = matches[i].index;
                var end = matches[i].index + len;
                if (cursor.ch >= start && cursor.ch <= end) {
                    return {
                        type: type,
                        start: start,
                        end: end,
                        string: val
                    };
                }
            }
        }
        return;
    }

	
	
	return this;
};



   
