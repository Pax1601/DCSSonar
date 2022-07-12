class Button
{
    constructor(app, callback, textures, relativeX, relativeY, relativeWidth, reliveHeight, state = 0)
    {
        if(!Button.allInstances) { Button.allInstances = []; }

        console.log(callback)

        this.callback = callback;

        this.state = state;
        this.textures = []
        textures.forEach(texture => this.textures.push(PIXI.Texture.from(texture)));
        this.sprite = new PIXI.Sprite(this.textures[this.state]);
        app.stage.addChild(this.sprite);
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        this.sprite.anchor.set(0.5);

        this.relativeX      = relativeX;  
        this.relativeY      = relativeY;
        this.relativeWidth  = relativeWidth;
        this.relativeHeight = reliveHeight;

        Button.allInstances.push(this);
    }

    update(size)
    {
        this.sprite.x = this.relativeX * size;
        this.sprite.y = this.relativeY * size;
        this.sprite.width = this.relativeWidth * size;
        this.sprite.height = this.relativeHeight * size;
    }

    clickEvent(event)
    {
        let left = this.sprite.x - this.sprite.width / 2;
        let right = this.sprite.x + this.sprite.width / 2;
        let bottom = this.sprite.y - this.sprite.height / 2;
        let top = this.sprite.y + this.sprite.height / 2;
        if (!(event.x < left || event.x > right || event.y < bottom || event.y > top ))
        {
            this.click(event);
        }
    }

    releaseEvent(event)
    {
        this.release();
    }

    getState()
    {
        return this.state;
    }
}

class StateButton extends Button
{
    click(event)
    {
        this.state++;
        if (this.state == this.textures.length) 
        {
            this.state = 0;
        }
        this.sprite.texture = this.textures[this.state];

        this.callback(this.state);
    }

    release()
    {

    }
}

class ThreeStateTemporaryButton extends Button
{
    click(event)
    {
        if (event.y < this.sprite.y)
        {
            this.state = 1;
        }
        else 
        {
            this.state = 2;
        }
        this.sprite.texture = this.textures[this.state];

        this.callback(this.state);
    }

    release()
    {
        this.state = 0;
        this.sprite.texture = this.textures[this.state];
        this.callback(this.state);
    }
}