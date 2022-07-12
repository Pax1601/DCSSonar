class sevenSegment
{
    constructor(app, relativeX, relativeY, digits, relativeHeight, spacing)
    {
        this.sharpContainer = new PIXI.Container();
        this.blurContainer = new PIXI.Container();
        this.digits = digits;
        this.relativeHeight = relativeHeight;
        this.spacing = spacing;
        this.relativeX = relativeX;
        this.relativeY = relativeY;
        this.sharpTexts = [];
        this.blurTexts = [];
        this.texture = null;
        this.sharpSprite = null;
        this.blurSprite = null;

        this.blurFilter = new PIXI.filters.BlurFilter();
        this.blurFilter.blur = 4;

        for (var i = 0; i < this.digits; i++)
        {
            {
                let text = new PIXI.Text('0', {fontFamily : '7Segments', fontSize: 25, fill : 0xFFFF00, align : 'center', padding: 10});
                text.x = (i - 1) * this.spacing;
                this.sharpContainer.addChild(text);
                this.sharpTexts.push(text);
            }
            {
                let text = new PIXI.Text('0', {fontFamily : '7Segments', fontSize: 25, fill : 0xFFFFFF, align : 'center', padding: 8});
                text.x = (i - 1) * this.spacing;
                text.alpha = 0.8;
                this.sharpContainer.addChild(text);
                this.blurTexts.push(text);
            }
        }
    }

    update(size)
    {
        if (this.sharpSprite != null)
        {
            let ar = this.sharpSprite.width / this.sharpSprite.height;

            this.sharpSprite.x = this.relativeX * size;
            this.sharpSprite.y = this.relativeY * size;
            this.sharpSprite.height = this.relativeHeight * size * 3;
            this.sharpSprite.width = ar * this.sharpSprite.height;

            this.blurSprite.x = this.relativeX * size;
            this.blurSprite.y = this.relativeY * size;
            this.blurSprite.height = this.relativeHeight * size * 3;
            this.blurSprite.width = ar * this.blurSprite.height;
        }
    }

    draw(value)
    {
        let rounded = Math.floor(value);
        for (var i = 0; i < this.digits; i++)
        {
            this.sharpTexts[i].text = "";
            this.sharpTexts[i].text = rounded.toString().padStart(this.digits, '0')[i];
            this.blurTexts[i].text = "";
            this.blurTexts[i].text = rounded.toString().padStart(this.digits, '0')[i];
        }

        if (this.texture != null) this.texture.destroy();
        this.texture = app.renderer.generateTexture(this.sharpContainer);
        
        if (this.sharpSprite == null) 
        {
            this.blurSprite = new PIXI.Sprite(this.texture);
            this.blurSprite.anchor.set(0.5);
            this.blurSprite.filters = [this.blurFilter]
            app.stage.addChild(this.blurSprite);

            this.sharpSprite = new PIXI.Sprite(this.texture);
            this.sharpSprite.anchor.set(0.5);
            app.stage.addChild(this.sharpSprite);
        }
        else 
        {
            this.sharpSprite.texture = this.texture;
            this.blurSprite.texture = this.texture;
        }
    }
}