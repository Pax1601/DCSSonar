class Knob
{
    constructor(app, callback, texture, relativeX, relativeY, relativeSize, initialAngle)
    {
        if(!Knob.allInstances) { Knob.allInstances = []; }

        this.callback = callback;

        this.sprite = PIXI.Sprite.from(texture);
        app.stage.addChild(this.sprite);
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        this.sprite.anchor.set(0.5);

        this.relativeX      = relativeX;  
        this.relativeY      = relativeY;
        this.relativeSize   = relativeSize;

        this.position       = initialAngle / 180 * Math.PI;
        this.sprite.rotation = initialAngle / 180 * Math.PI;

        this.mouseStartAngle = 0;
        this.rotating  = false;
        this.rotationStartAngle = 0;

        Knob.allInstances.push(this);
    }

    update(size)
    {
        this.sprite.x = this.relativeX * size;
        this.sprite.y = this.relativeY * size;
        this.sprite.width = this.relativeSize * size;
        this.sprite.height = this.relativeSize * size;
    }

    wheelEvent(event)
    {
        let x = event.x;
        let y = event.y;
        let distance = Math.sqrt(Math.pow(x - this.sprite.x, 2) + Math.pow(y - this.sprite.y, 2));
        if (distance < this.sprite.width / 2)
        {
            this.rotate(-Math.sign(event.deltaY));
        }
    }

    clickEvent(event)
    {
        let x = event.x;
        let y = event.y;
        let distance = Math.sqrt(Math.pow(x - this.sprite.x, 2) + Math.pow(y - this.sprite.y, 2));
        if (distance < this.sprite.width / 2)
        {
            this.rotating = true;
            this.mouseStartAngle = Math.atan2(y - this.sprite.y, x - this.sprite.x);
            this.rotationStartAngle = this.position;
            console.log(this.rotationStartAngle)
        }
    }

    moveEvent(event)
    {
        if (this.rotating)
        {
            let x = event.x;
            let y = event.y;
            let rotationAngle = Math.atan2(y - this.sprite.y, x - this.sprite.x);
            let deltaRotation = rotationAngle - this.mouseStartAngle;
            this.setRotation(this.rotationStartAngle + deltaRotation);
        }
    }

    releaseEvent(event)
    {
        this.rotating = false;
    }
}

class RotationKnob extends Knob
{
    constructor(app, callback, texture, relativeX, relativeY, relativeSize, deltaRotation, minRotation, maxRotation, initialAngle = 0)
    {
        super(app, callback, texture, relativeX, relativeY, relativeSize, initialAngle);
        this.minRotation = minRotation / 180 * Math.PI;
        this.maxRotation = maxRotation / 180 * Math.PI;
        this.deltaRotation = deltaRotation / 180 * Math.PI;
    }

    rotate(direction)
    {
        this.setRotation(this.sprite.rotation + direction * this.deltaRotation);
    }

    setRotation(position)
    {
        console.log(position)
        this.position = position;
        this.sprite.rotation = position;
        this.sprite.rotation = Math.max(this.minRotation, this.sprite.rotation);
        this.sprite.rotation = Math.min(this.maxRotation, this.sprite.rotation);
        if (this.minRotation != -Infinity && this.maxRotation != Infinity)
        {
            this.callback((this.sprite.rotation - this.minRotation) / (this.maxRotation - this.minRotation));
        }
        else 
        {
            this.callback(this.sprite.rotation);
        }
    }
}

class PositionKnob extends Knob
{
    constructor(app, callback, texture, relativeX, relativeY, relativeSize, positions, position = 0)
    {
        super(app, callback, texture, relativeX, relativeY, relativeSize);
        this.position = position;
        this.positions = positions;
        this.sprite.rotation = this.positions[this.position] / 180 * Math.PI
    }

    rotate(direction)
    {
        this.setRotation(this.position + direction);
    }

    setRotation(position)
    {
        this.position = position;
        this.position = Math.max(0, this.position);
        this.position = Math.min(this.positions.length - 1, this.position);
        this.sprite.rotation = this.positions[this.position] / 180 * Math.PI;
        this.callback(this.position);
    }
}