class Pong
{
	constructor(sterowanie)
	{
		this.c  = document.createElement("canvas");
		this.cE = document.getElementsByTagName("canvas")[0];

		this.c.width = 1200;
		this.c.height = 600;

		this.cE.width  = this.c.width;
		this.cE.height = this.c.height;

		this.ctx  = this.c .getContext("2d");
		this.ctxE = this.cE.getContext("2d");

		this.ctx.font = "36px 'Press Start 2P'";
		this.ctx.textAlign = "center";

		this.sterowanie = sterowanie;
		this.punkty = [0, 0];

		this.pilka = {x: this.c.width / 2, y: this.c.height / 2};
		this.pilkaRuch = {x: Math.round(Math.random()) * 14 - 7, y: Math.random() * 6 - 3};
		this._klatekOdOdbicia = 0;
	}

	klatka()
	{
		if (this.sterowanie[0] < 0)
			this.sterowanie[0] = 0;
		else if (this.sterowanie[0] + 75 > this.c.height)
			this.sterowanie[0] = this.c.height - 75;
		
		if (this.sterowanie[1] < 0)
			this.sterowanie[1] = 0;
		else if (this.sterowanie[1] + 75 > this.c.height)
			this.sterowanie[1] = this.c.height - 75;


		this.pilka.x += this.pilkaRuch.x;
		this.pilka.y += this.pilkaRuch.y;

		if (this.pilka.y < 5)
			this.pilkaRuch.y = Math.abs(this.pilkaRuch.y);
		else if (this.pilka.y > this.c.height - 5)
			this.pilkaRuch.y = -Math.abs(this.pilkaRuch.y);
		
		if (this.pilka.x < 5 || this.pilka.x > this.c.width - 5)
		{
			if (this.pilka.x < 5) this.punkty[1]++;
			else                  this.punkty[0]++;

			this.pilkaRuch.x = -this.pilkaRuch.x;
		}

		if
		(
			((
				this.pilka.x < 80 && this.pilka.x > 60 &&
				this.pilka.y > this.sterowanie[0] - 5 && this.pilka.y < this.sterowanie[0] + 80
			) ||
			(
				this.pilka.x > this.c.width - 80 && this.pilka.x < this.c.width - 60 &&
				this.pilka.y > this.sterowanie[1] - 5 && this.pilka.y < this.sterowanie[1] + 80
			)) && this._klatekOdOdbicia > 2
		)
		{
			this.pilkaRuch.x = -this.pilkaRuch.x;
			if (this.pilka.x < 80)
			{
				this.pilkaRuch.y = ((this.pilka.y - (this.sterowanie[0] - 5)) / (this.sterowanie[0] + 80 - this.sterowanie[0] + 5)) * 14 - 7;
			}
			else
			{
				this.pilkaRuch.y = ((this.pilka.y - (this.sterowanie[1] - 5)) / (this.sterowanie[1] + 80 - this.sterowanie[1] + 5)) * 14 - 7;
			}
			this._klatekOdOdbicia = 0;
		}

		this.ctx.fillStyle = "#222";
		this.ctx.fillRect(0, 0, this.c.width, this.c.height);
		
		this.ctx.fillStyle = "#FFF";
		for (let i = 0; i < this.c.height / 18; i++)
		{
			this.ctx.fillRect(this.c.width / 2 - 1, i * 18, 1, 10);
		}

		this.ctx.fillText(this.punkty[0], this.c.width / 2 - 50, 80);
		this.ctx.fillText(this.punkty[1], this.c.width / 2 + 50, 80);


		this.ctx.beginPath();
		this.ctx.arc(this.pilka.x, this.pilka.y, 5, 0, 2 * Math.PI);
		this.ctx.fill();

		this.ctx.fillRect(65, this.sterowanie[0], 10, 75);
		this.ctx.fillRect(this.c.width - 75, this.sterowanie[1], 10, 75);

		this.ctxE.putImageData(this.ctx.getImageData(0, 0, this.c.width, this.c.height), 0, 0);

		this._klatekOdOdbicia++;
	}
}

/* === AI === */

class AI
{
	constructor(opoznienie, blad, prawa = false)
	{
		this.opoznienie = opoznienie;
		this.blad = blad;
		this.prawa = prawa;
		this.pozycjaDocelowa = 0;
		this.obliczonoPozycje = false;
		this.klatkiDoOdbicia = 0;
	}

	sterowanie(pilkaX, pilkaY, ruchX, ruchY, pozycja)
	{
		if ((this.prawa ? ruchX > 0 : ruchX < 0) && !this.obliczonoPozycje)
		{
			while(this.prawa ? pilkaX < 1125 : pilkaX > 75)
			{
				pilkaX += ruchX;
				pilkaY += ruchY;

				this.klatkiDoOdbicia++;

				if (pilkaY < 5 || pilkaY > 595)
					ruchY = -ruchY;
			}

			this.pozycjaDocelowa = pilkaY + Math.random() * this.blad - (this.blad / 2) - 37.5;
			this.obliczonoPozycje = true;
		}
		else if ((this.prawa ? ruchX < 0 : ruchX > 0) && this.obliczonoPozycje)
		{
			this.obliczonoPozycje = false;
			this.klatkiDoOdbicia = 0;
		}

		let doPoruszenia = 0;

		if (this.klatkiDoOdbicia > 0)
			this.klatkiDoOdbicia--;

		if (this.klatkiDoOdbicia < this.opoznienie)
		{
			if (Math.abs(this.pozycjaDocelowa - pozycja) > 5)
				doPoruszenia = this.pozycjaDocelowa - pozycja > 0 ? 5 : -5;
		}

		return pozycja + doPoruszenia;
	}
}

/* === STEROWANIE === */

let audio;
let glosnosc = 0;
let czulosc = 30;
let minimum = 10;
let plynnosc = 10;

let sterowanie = [10, 0];


let pong = new Pong(sterowanie);
let ai = new AI(75, 95);

window.onload = async function()
{
	let stream = null;

	try
	{
		stream = await navigator.mediaDevices.getUserMedia({audio: true});
	}
	catch(err)
	{
		pong.ctxE.fillStyle = "#222";
		pong.ctxE.fillRect(0, 0, pong.c.width, pong.c.height);

		pong.ctxE.fillStyle = "#FFF";

		pong.ctxE.textAlign = "center";
		pong.ctxE.font = "36px sans-serif";

		pong.ctxE.fillText("Gra musi mieć dostęp do mikrofonu!", pong.c.width / 2, 200);
		pong.ctxE.font = "24px sans-serif";
		pong.ctxE.fillText("Odświerz stronę i zezwól przeglądarce na używanie mikrofonu.", pong.c.width / 2, 250);
		return;
	}
    
	audio = document.createElement("audio");

	audio.srcObject = stream;

	var ctxA = new AudioContext();
	var audioSrc = ctxA.createMediaElementSource(audio);
	var analyser = ctxA.createAnalyser();
	analyser.smoothingTimeConstant = 0;
	analyser.fftSize = 512;

	audioSrc.connect(analyser);
	
	var frequencyData = new Uint8Array(analyser.frequencyBinCount);

	function renderFrame()
	{
		requestAnimationFrame(renderFrame);

		analyser.getByteFrequencyData(frequencyData);

		
		glosnosc = 0;

		for (let i = 0; i < frequencyData.length; i++)
		{
			glosnosc += frequencyData[i];
		}

		glosnosc /= analyser.fftSize;
	}
	audio.play();
	renderFrame();

	setInterval(() =>
	{
		pong.sterowanie[0] = ai.sterowanie(pong.pilka.x, pong.pilka.y, pong.pilkaRuch.x, pong.pilkaRuch.y, pong.sterowanie[0]);
		//pong.sterowanie[1] = ai2.sterowanie(pong.pilka.x, pong.pilka.y, pong.pilkaRuch.x, pong.pilkaRuch.y, pong.sterowanie[1]);
		
		pong.sterowanie[1] = 600 - pong.sterowanie[1];
		pong.sterowanie[1] += ((glosnosc - minimum) * czulosc - pong.sterowanie[1]) / plynnosc;
		pong.sterowanie[1] = 600 - pong.sterowanie[1];

		pong.klatka();
	}, 20);
};

document.getElementById("czulosc").oninput = (e) =>
{
	czulosc = e.target.valueAsNumber;
}
document.getElementById("minimum").oninput = (e) =>
{
	minimum = e.target.valueAsNumber;
}
document.getElementById("plynnosc").oninput = (e) =>
{
	plynnosc = e.target.valueAsNumber;
}