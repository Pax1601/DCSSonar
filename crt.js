class CRT {
    constructor(app)
    {
        this.range_rings = 5;
        this.max_noise_density = 500;
        this.max_noise_level = 1;
        this.persistency = 60;

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

        this.container = new PIXI.Container();

        this.background = new PIXI.Graphics();
        this.rangeRings = new PIXI.Graphics();
        this.angleTicks = new PIXI.Graphics();

        this.returnsSprites = [];
        this.angleTexts = [];

        app.stage.addChild(this.container);
        this.container.addChild(this.background)
        this.container.addChild(this.rangeRings);
        this.container.addChild(this.angleTicks);

        this.radius = 0;

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
    // Draw returns
    drawReturns(timer) {
        const returnContainer = new PIXI.Container();
        const returnGraphics = new PIXI.Graphics();
        returnContainer.addChild(returnGraphics);

        if (timer == 0)
        {
            let noise_level = this.max_noise_level * this.videoGain * this.crtIntensity;
            let noise_density = this.max_noise_density * this.videoGain;
            for (let i = 0; i < noise_density ; i++)
            {
                let angle = Math.random() * 2 * Math.PI;
                let R = Math.pow(Math.random(), 0.5) * this.radius;
                returnGraphics.beginFill(0xf0d997, noise_level * Math.random());
                returnGraphics.drawCircle(R * Math.cos(angle), R * Math.sin(angle), 2);
                returnGraphics.endFill()
            }
            
        /*
        for (let i = 0; i < contacts.length; i++)
        {
        let R = radius * contacts[i][0] / max_range;
        let angle = (270 + contacts[i][1]) / 180 * Math.PI;
        let intensity = contacts[i][2];
        let dRMax = 1.5 * intensity;
        for (let dR = -dRMax; dR <= dRMax; dR += 1)
        {
            let dAngleMax = 0.03 * intensity / (0.1 + 2 * R) * radius;
            for (let dAngle = -dAngleMax; dAngle <= dAngleMax; dAngle += 0.01)
            {
            let relativeIntensity = Math.pow((dRMax - Math.abs(dR)) / 10 * (dAngleMax - Math.abs(dAngle)) / (dAngleMax), 0.5);
            if (relativeIntensity > 1) relativeIntensity = 1;
            returnGraphics.lineStyle(1, 0xffce00, Math.pow(relativeIntensity, 4));
            if (dAngle > -dAngleMax)
            {
                returnGraphics.lineTo((R + dR) * Math.cos(angle + dAngle), (R + dR) * Math.sin(angle + dAngle));
            }
            returnGraphics.moveTo((R + dR) * Math.cos(angle + dAngle), (R + dR) * Math.sin(angle + dAngle));
            }

            for (let dAngle = -dAngleMax; dAngle <= dAngleMax; dAngle += 0.01)
            {
            let relativeIntensity = Math.pow((dRMax - Math.abs(dR)) / 10 * (dAngleMax - Math.abs(dAngle)) / (dAngleMax), 0.5);
            if (relativeIntensity > 1) relativeIntensity = 1;
            returnGraphics.lineStyle(1, 0xFFFFFF, Math.pow(relativeIntensity, 18));
            if (dAngle > -dAngleMax)
            {
                returnGraphics.lineTo((R + dR) * Math.cos(angle + dAngle), (R + dR) * Math.sin(angle + dAngle));
            }
            returnGraphics.moveTo((R + dR) * Math.cos(angle + dAngle), (R + dR) * Math.sin(angle + dAngle));
            }
        }
        }
        */
        }

        let dRMax = 10;
        for (let dR = -dRMax; dR <= dRMax; dR += 2)
        {
            let relativeIntensity = 0.1 * Math.pow(1 - Math.abs((dR) / dRMax), 2)
            returnGraphics.lineStyle(2, 0xf0d997, this.cursorIntensity * relativeIntensity);
            returnGraphics.drawCircle(this.radius * this.cursorRange * Math.cos(this.cursorPosition), this.radius * this.cursorRange * Math.sin(this.cursorPosition), this.radius * 0.1 + dR);
            returnGraphics.endFill()
        }
        returnGraphics.lineStyle(1, 0xFFFFFF, 0.2 * this.cursorIntensity);
        returnGraphics.drawCircle(this.radius * this.cursorRange * Math.cos(this.cursorPosition), this.radius * this.cursorRange * Math.sin(this.cursorPosition), this.radius * 0.1);
        returnGraphics.endFill()

        returnGraphics.lineStyle(1, 0x000000, 0);
        returnGraphics.drawCircle(0, 0, this.radius);

    
        let texture = app.renderer.generateTexture(returnContainer);
        let sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        this.returnsSprites.push(sprite);
        app.stage.addChild(sprite);
        if (this.returnsSprites.length == this.persistency)
        {
            app.stage.removeChild(this.returnsSprites[0]);
            delete this.returnsSprites[0];
            this.returnsSprites.shift();
        }
        
    }

    fadeReturns()
    {
        for (let i = 0; i < this.returnsSprites.length; i++)
        {
            this.returnsSprites[i].x = this.container.x;
            this.returnsSprites[i].y = this.container.y;
            this.returnsSprites[i].alpha = 0.9 * this.returnsSprites[i].alpha 
        }
    }
}


