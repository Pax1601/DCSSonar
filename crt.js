function randomNormal(R, avg, sigma)
{
    return Math.exp(-Math.pow(R - avg, 2) / (2 * sigma)) * 1 / (sigma * Math.sqrt(2 * Math.PI))
};


class CRTFadeRenderer
{
    constructor(persistency)
    {
        this.persistency = persistency;
        this.textures = [];
        this.sprites = [];
        for (var i = 0; i < this.persistency; i++)
        {
            this.textures.push(PIXI.RenderTexture.create(800, 800));
            this.sprites.push(new PIXI.Sprite(this.textures[i]));
            this.sprites[i].anchor.set(0.5);
            app.stage.addChild(this.sprites[i]);
        } 

        this.container = new PIXI.Container();

        this.blurFilter = new PIXI.filters.BlurFilter();
        this.blurFilter.blur = 4;

        this.sharpGraphics = new PIXI.Graphics();
        this.sharpGraphics.x = 400;
        this.sharpGraphics.y = 400;
        this.blurGraphics = new PIXI.Graphics();
        this.blurGraphics.x = 400;
        this.blurGraphics.y = 400;
        this.blurGraphics.filters = [this.blurFilter];

        this.container.addChild(this.sharpGraphics);
        this.container.addChild(this.blurGraphics);
    }

    getSharpGraphics() {return this.sharpGraphics;}
    getBlurGraphics() {return this.blurGraphics;}

    clear()
    {
        this.sharpGraphics.clear();
        this.blurGraphics.clear();
    }

    render()
    {
        this.textures.unshift(this.textures.pop());
        this.sprites.unshift(this.sprites.pop());
        this.sprites[0].alpha = 1;
        app.renderer.render(this.container, this.textures[0]);
    }

    update(x, y)
    {
        for (let i = 0; i < this.sprites.length; i++)
        {
            this.sprites[i].x = x;
            this.sprites[i].y = y;
        }
    }

    fade()
    {
        for (let i = 0; i < this.sprites.length; i++)
        {
            this.sprites[i].alpha = (1 - 5 * 1 / this.persistency) * this.sprites[i].alpha;
        }
    }
}

class CRT {
    constructor(app)
    {
        this.range_rings = 5;
        this.max_noise_density = 50;
        this.max_noise_level = 1;
        this.fastPersistency = 40;
        this.slowPersistency = 300;

        this.state = 1;
        this.range = 5;
        this.frequency = 2;
        this.mode = 0;
        this.cursorPosition = 0;
        this.cursorRange = 0.5;
        this.cursorIntensity = 0.5;
        this.crtIntensity = 0.5;
        this.videoGain = 0.5;
        this.audioGain = 0.5;
        this.mtiThreshold = 0;
        this.seaDepth = 2; 
        this.sonarDepth = 0;
        this.rangeSwitch = 0;
        
        this.surfaceReflectivity = 0.7;
        this.bottomReflectivity = 0.5;
        this.layerReflectivity = 0.7;

        this.container = new PIXI.Container();

        this.background = new PIXI.Graphics();
        this.rangeRings = new PIXI.Graphics();
        this.angleTicks = new PIXI.Graphics();

        this.angleTexts = [];

        app.stage.addChild(this.container);
        this.container.addChild(this.background)
        this.container.addChild(this.rangeRings);
        this.container.addChild(this.angleTicks);

        this.slowRenderer = new CRTFadeRenderer(this.slowPersistency);
        this.fastRenderer = new CRTFadeRenderer(this.fastPersistency);

        this.radius = 0;

        this.contacts = [[2.5, 90, 8]];

        this.setupAngleTexts();

        this.ping = PIXI.sound.Sound.from('sounds/ping_med.mp3');

        this.timer = 0;

        this.currentR = 0;
        
    }

    update(size)
    {
        this.container.x = 452.0 / 1024.0 * size;
        this.container.y = 310.0 / 1024.0 * size;
        this.radius = 422.0 / 2.0 * size / 1024.0;

        this.slowRenderer.update(this.container.x, this.container.y)
        this.fastRenderer.update(this.container.x, this.container.y)
    }

    setCursorIntensity(value) {this.cursorIntensity = value;};
    setCrtIntensity(value) {this.crtIntensity = value;};
    setVideoGain(value) {this.videoGain = value;};
    setAudioGain(value) {this.audioGain = value;};
    setCursorPosition(value) {this.cursorPosition = value;};
    setMtiThreshold(value) {this.mtiThreshold = value;};
    setFrequency(value) {this.frequency = value;};
    setMode(value) {this.mode = value;};
    setState(value) {this.state = value;};
    setSeaDepth(value) {this.seaDepth = value;};
    setLayerDepth(value) {this.layerDepth = value;};
    setSonarDepth(value) {this.sonarDepth = value;};
    setContacts(value) {this.contacts = value;};
    setRangeSwitch(value)
    {
        let dirs = [0, 1, -1];
        this.rangeSwitch = dirs[value];
    }
    setRange(value) {
        let ranges = [1, 3, 5, 8, 12, 20];
        this.range = ranges[value];
    };

    getCursorPosition(){return this.cursorPosition}
    getCursorRange(){return this.range * this.cursorRange * 1000;}

    drawBackground()
    {
        this.background.clear()
        this.background.beginFill(0x725c00, 1);
        this.background.drawCircle(0, 0,  this.radius, this.radius);
        this.background.endFill();
    }

    setupAngleTexts()
    {
        for (let angle = 0; angle < 2 * Math.PI - 0.1; angle += 2 * Math.PI / 36)
        {
            let text = new PIXI.Text((Math.round(angle * 180 / Math.PI) / 10).toString() + "", {fontFamily : 'Arial', fontSize: 10, fill : 0xFFFFFF, align : 'center'});
            this.container.addChild(text);
            text.anchor.set(0.5); 
            this.angleTexts.push(text);
        }
    }

    drawAngles()
    {
        let R1 = -this.radius * 1.03
        let R2 = -this.radius * 1.0
        let R3 = -this.radius * 1.08
        let i = 0;
        this.angleTicks.clear()
        this.angleTicks.lineStyle(2, 0xFFFFFF, 1)
        for (let angle = 0; angle < 2 * Math.PI - 0.1; angle += 2 * Math.PI / 36)
        {
            this.angleTicks.moveTo(-R1 * Math.sin(angle), R1 * Math.cos(angle)).lineTo(-R2 * Math.sin(angle), R2 * Math.cos(angle));
            this.angleTexts[i].x = -R3 * Math.sin(angle);
            this.angleTexts[i].y = R3 * Math.cos(angle);
            i++
        }
    }

    drawNoise(currentR)
    {
        let graphics = this.slowRenderer.getSharpGraphics();
        let noise_level = this.max_noise_level * this.videoGain * this.crtIntensity;
        let noise_density = this.max_noise_density * this.videoGain;
        graphics.beginFill(0xf0d997, currentR / this.range * noise_level * Math.random());
        graphics.lineStyle(0x000000, 0);
        let n = randomNormal(currentR, this.seaDepth, 0.2);
        for (let i = 0; i < noise_density * n ; i++)
        {
            let angle = Math.random() * 2 * Math.PI;
            let R = currentR / this.range * this.radius;
            graphics.drawCircle(R * Math.cos(angle), R * Math.sin(angle), Math.random() + 1);
        }
        graphics.endFill();
    }

    drawReturn(range, angle, intensity, sharpGraphics, blurGraphics)
    {
        let r = range / 20;
        let R = range / this.range * this.radius;
        let scaledIntensity = 0.005 * intensity * Math.pow(1 / r, 2);
        this.ping.play({volume: 0.005 * scaledIntensity * this.audioGain});
        if (R < this.radius)
        {
            let dAngleMax = 0.025 / r + 0.01 * intensity;
            let delta = 0.01;
            for (let dAngle = -dAngleMax; dAngle < dAngleMax; dAngle += delta)
            {
                let relativeIntensity = scaledIntensity * this.videoGain * this.crtIntensity * Math.pow(Math.abs((dAngleMax - Math.abs(dAngle)) / (dAngleMax)), 3 - 2* this.videoGain);
                if (relativeIntensity > 1) relativeIntensity = 1;

                blurGraphics.lineStyle(10, 0xffce00, relativeIntensity);
                blurGraphics.moveTo(R * Math.cos(angle + dAngle), R * Math.sin(angle + dAngle));
                blurGraphics.lineTo(R * Math.cos(angle + dAngle + delta), R * Math.sin(angle + dAngle + delta));

                blurGraphics.lineStyle(3, 0xFFFFFF, relativeIntensity);
                blurGraphics.moveTo(R * Math.cos(angle + dAngle), R * Math.sin(angle + dAngle));
                blurGraphics.lineTo(R * Math.cos(angle + dAngle + delta), R * Math.sin(angle + dAngle + delta));

                sharpGraphics.lineStyle(3, 0xFFFFFF, relativeIntensity);
                sharpGraphics.moveTo(R * Math.cos(angle + dAngle), R * Math.sin(angle + dAngle));
                sharpGraphics.lineTo(R * Math.cos(angle + dAngle + delta), R * Math.sin(angle + dAngle + delta));
            }
        }
    }

    drawReturns(returns, oldR, currentR)
    {
        let sharpGraphics = this.slowRenderer.getSharpGraphics();
        let blurGraphics = this.slowRenderer.getBlurGraphics();

        for (let i = 0; i < returns.length; i++)
        {
            let range = returns[i][0];
            if (currentR > range && range > oldR)
            {
                let angle = (returns[i][1] - 90) / 180 * Math.PI;
                let intensity = returns[i][2];
                this.drawReturn(range, angle, intensity, sharpGraphics, blurGraphics);
            }
        }

        sharpGraphics.lineStyle(1, 0x000000, 0);
        sharpGraphics.drawCircle(0, 0, this.radius);

        blurGraphics.lineStyle(1, 0x000000, 0);
        blurGraphics.drawCircle(0, 0, this.radius);
    }

    drawCursor()
    {
        let sharpGraphics = this.fastRenderer.getSharpGraphics();
        let blurGraphics = this.fastRenderer.getBlurGraphics();

        blurGraphics.lineStyle(3, 0xffce00, 0.3 * this.cursorIntensity);
        blurGraphics.drawCircle(this.radius * this.cursorRange * Math.sin(this.cursorPosition), -this.radius * this.cursorRange * Math.cos(this.cursorPosition), this.radius * 0.05);

        blurGraphics.lineStyle(2, 0xFFFFFF, 0.2 * this.cursorIntensity);
        blurGraphics.drawCircle(this.radius * this.cursorRange * Math.sin(this.cursorPosition), -this.radius * this.cursorRange * Math.cos(this.cursorPosition), this.radius * 0.05);

        sharpGraphics.lineStyle(2, 0xFFFFFF, 0.2 * this.cursorIntensity);
        sharpGraphics.drawCircle(this.radius * this.cursorRange * Math.sin(this.cursorPosition), -this.radius * this.cursorRange * Math.cos(this.cursorPosition), this.radius * 0.05);
    
        sharpGraphics.lineStyle(1, 0x000000, 0);
        sharpGraphics.drawCircle(0, 0, this.radius);

        blurGraphics.lineStyle(1, 0x000000, 0);
        blurGraphics.drawCircle(0, 0, this.radius);
    }

    // Draw returns
    draw(delta) 
    {
        this.slowRenderer.clear();
        this.fastRenderer.clear();

        this.timer += delta;
        let c = 1.09361 * 1480;
        let pingInterval = this.range * 1000 / c;
        if (this.timer > pingInterval) this.timer = 0;

        if (!this.state) return;

        this.cursorRange += 0.01 * this.rangeSwitch;
        this.cursorRange = Math.max(0, Math.min(1, this.cursorRange));

        let oldR = this.currentR;
        this.currentR = this.range * this.timer / pingInterval;
        
        this.drawNoise(this.currentR);

        let returns = [];
        for (let i = 0; i < this.contacts.length; i++)
        {
            let range = this.contacts[i][0];
            let depth = this.contacts[i][3];
            let topBounceRange = Math.sqrt(Math.pow(this.sonarDepth + depth, 2) + Math.pow(range, 2)); 
            let bottomBounceRange = Math.sqrt(Math.pow(2 * this.seaDepth - (this.sonarDepth + depth), 2) + Math.pow(range, 2));
            returns.push([this.contacts[i][0], this.contacts[i][1], this.contacts[i][2]]);
            returns.push([topBounceRange, this.contacts[i][1], this.surfaceReflectivity * this.contacts[i][2]]);
            returns.push([bottomBounceRange, this.contacts[i][1], this.bottomReflectivity  * this.contacts[i][2]]);
        }      

        let requestRender = false;
        for (let i = 0; i < returns.length; i++)
        {
            let range = returns[i][0];
            if (this.currentR > range && range > oldR)
            {
                requestRender = true;
                break;
            }
        }

        if (requestRender)
        {
            this.drawReturns(returns, oldR, this.currentR);   
        }
        
        if (this.timer == 0)
        {
            this.ping.play({volume: 0.1 * this.audioGain});
        }

        this.drawCursor();   

        this.slowRenderer.render();
        this.fastRenderer.render();
    }

    fade()
    {
        this.slowRenderer.fade();
        this.fastRenderer.fade();
    }
}


