function randomNormals(rng)
{
    let u1 = 0, u2 = 0;
    //Convert [0,1) to (0,1)
    while (u1 === 0) u1 = rng();
    while (u2 === 0) u2 = rng();
    const R = Math.sqrt(-2.0 * Math.log(u1));
    const sigma = 2.0 * Math.PI * u2;
    return [R * Math.cos(sigma), R * Math.sin(sigma)];
};

function randomSkewNormal(rng, eps, omega, a = 0) 
{
    const [u0, v] = randomNormals(rng);
    if (a === 0) {
        return eps + omega * u0;
    }
    const delta = a / Math.sqrt(1 + a * a);
    const u1 = delta * u0 + Math.sqrt(1 - delta * delta) * v;
    const z = u0 >= 0 ? u1 : -u1;
    return eps + omega * z;
};

class CRTFadeRenderer
{
    constructor(persistency)
    {
        this.persistency = persistency;
        this.sprites = [];
    }

    render(container)
    {
        let texture = app.renderer.generateTexture(container);
        let sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        this.sprites.push(sprite);
        app.stage.addChild(sprite);
        if (this.sprites.length == this.persistency)
        {
            app.stage.removeChild(this.sprites[0]);
            delete this.sprites[0];
            this.sprites.shift();
        }
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
            this.sprites[i].alpha = (1 - 1 / this.persistency) * this.sprites[i].alpha;
        }
    }
}

class CRT {
    constructor(app)
    {
        this.range_rings = 5;
        this.max_noise_density = 5000;
        this.max_noise_level = 1;
        this.fastPersistency = 20;
        this.slowPersistency = 180;

        this.state = 0;
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

        this.blurFilter = new PIXI.filters.BlurFilter();
        this.blurFilter.blur = 4;

        this.slowRenderer = new CRTFadeRenderer(this.slowPersistency);
        this.fastRenderer = new CRTFadeRenderer(this.fastPersistency);

        this.radius = 0;

        this.contacts = [[2.5, 90, 8]];

        this.setupAngleTexts();
    }

    update(size)
    {
        this.container.x = 452.0 / 1024.0 * size;
        this.container.y = 310.0 / 1024.0 * size;
        this.radius = 422.0 / 2.0 * size / 1024.0;
    }

    setCursorIntensity(value) {this.cursorIntensity = value;};
    setCrtIntensity(value) {this.crtIntensity = value;};
    setVideoGain(value) {this.videoGain = value;};
    setAudioGain(value) {this.audioGain = value;};
    setCursorPosition(value) {this.cursorPosition = value;};
    setMtiThreshold(value) {this.mtiThreshold = value;};
    setRange(value) {this.range = value;};
    setFrequency(value) {this.frequency = value;};
    setMode(value) {this.mode = value;};
    setState(value) {this.state = value;};
    setSeaDepth(value) {this.seaDepth = value;};
    setLayerDepth(value) {this.layerDepth = value;};
    setSonarDepth(value) {this.sonarDepth = value;};
    setContacts(value) {this.contacts = value;};

    getPingInterval()
    {
        return this.frequency;
    }

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

    //// Draw range rings
    //drawRangeRings(radius)
    //{
    //    this.rangeRings.clear();
    //    this.rangeRings.lineStyle(2, 0xf0d997, 1);
    //    for (let i = 0; i < this.range_rings; i++)
    //    {
    //        this.rangeRings.drawCircle(0, 0, this.radius / this.range_rings * i);
    //    }
    //}
//

    drawNoise()
    {
        let graphics = new PIXI.Graphics();

        let noise_level = this.max_noise_level * this.videoGain * this.crtIntensity;
        let noise_density = this.max_noise_density * this.videoGain;
        for (let i = 0; i < noise_density ; i++)
        {
            let angle = Math.random() * 2 * Math.PI;
            let r = randomSkewNormal(Math.random, this.seaDepth / this.range, 0.2, 4);
            r = Math.max(0, r);
            r = Math.min(1, r);
            let R = r * this.radius;
            if (r < 1)
            {
                graphics.beginFill(0xf0d997, r * noise_level * Math.random());
                graphics.lineStyle(0x000000, 0);
                graphics.drawCircle(R * Math.cos(angle), R * Math.sin(angle), Math.random() + 1);
                graphics.endFill()
            }
        }

        graphics.lineStyle(1, 0x000000, 0);
        graphics.drawCircle(0, 0, this.radius);

        return graphics;
    }

    drawReturn(R, angle, intensity, sharpGraphics, blurGraphics)
    {
        if (R < this.radius)
        {
            let dAngleMax = 0.03 * intensity / (0.1 + 2 * R) * this.radius;
            let delta = 0.01;
            for (let dAngle = -dAngleMax; dAngle < dAngleMax; dAngle += delta)
            {
                let relativeIntensity = this.crtIntensity * Math.pow((dAngleMax - Math.abs(dAngle)) / (dAngleMax), 1);
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

    drawReturns()
    {
        let sharpGraphics = new PIXI.Graphics();
        let blurGraphics = new PIXI.Graphics();
        blurGraphics.filters = [this.blurFilter];

        for (let i = 0; i < this.contacts.length; i++)
        {
            let range = this.contacts[i][0];
            let R = this.radius * this.contacts[i][0] / this.range;
            let angle = (this.contacts[i][1] - 90) / 180 * Math.PI;
            let intensity = this.videoGain * this.contacts[i][2];
            let depth = this.contacts[i][3];

            this.drawReturn(this.radius * range / this.range, angle, intensity * range / this.range, sharpGraphics, blurGraphics);

            if (this.sonarDepth > this.layerDepth && depth > this.layerDepth)
            {
                let topBounceRange = Math.sqrt(Math.pow(this.sonarDepth + depth, 2) + Math.pow(range, 2)); 
                console.log(topBounceRange / this.range)
                this.drawReturn(this.radius * topBounceRange / this.range, angle, this.surfaceReflectivity * intensity * topBounceRange / this.range, sharpGraphics, blurGraphics);
//
                let bottomBounceRange = Math.sqrt(Math.pow(2 * this.seaDepth - (this.sonarDepth + depth), 2) + Math.pow(range, 2));
                console.log(bottomBounceRange / this.range)
                this.drawReturn(this.radius * bottomBounceRange / this.range, angle, this.bottomReflectivity  * intensity * bottomBounceRange / this.range, sharpGraphics, blurGraphics);
            }

        }

        sharpGraphics.lineStyle(1, 0x000000, 0);
        sharpGraphics.drawCircle(0, 0, this.radius);

        blurGraphics.lineStyle(1, 0x000000, 0);
        blurGraphics.drawCircle(0, 0, this.radius);

        return [sharpGraphics, blurGraphics];
    }

    drawCursor()
    {
        let sharpGraphics = new PIXI.Graphics();
        let blurGraphics = new PIXI.Graphics();
        blurGraphics.filters = [this.blurFilter];

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

        return [sharpGraphics, blurGraphics];
    }

    // Draw returns
    draw(timer) 
    {
        if (timer == 0)
        {
            let noise = this.drawNoise();
            this.slowRenderer.render(noise);

            let returnGraphics = this.drawReturns();   
            this.slowRenderer.render(returnGraphics[0]);
            this.slowRenderer.render(returnGraphics[1]);
        }

        let cursorGraphics = this.drawCursor();   
        this.fastRenderer.render(cursorGraphics[0]);
        this.fastRenderer.render(cursorGraphics[1]);
    }

    fade()
    {
        this.slowRenderer.update(this.container.x, this.container.y)
        this.fastRenderer.update(this.container.x, this.container.y)

        this.slowRenderer.fade();
        this.fastRenderer.fade();
    }
}


