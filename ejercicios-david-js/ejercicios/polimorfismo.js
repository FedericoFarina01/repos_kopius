class Animal {
    constructor(especie) {
        this.especie = especie;
    }

    hacerSonido() {
        console.log("Animal haciendo su sonido");
    }

    presentarse() {
        console.log(`Soy un ${this.especie}`);
    }
}

class Perro extends Animal {
    hacerSonido() {
        super.hacerSonido();
        console.log(`El ${this.especie} hace: Guau guau!`);
    }
}

class Gato extends Animal {
    hacerSonido() {
        console.log(`El ${this.especie} hace: Miau miau!`);
    }
}

class Tigre extends Animal {
    hacerSonido() {
        console.log(`El ${this.especie} hace: Roaar!`);
    }
}

const animales = [
    new Perro("Perro"),
    new Gato("Gato"),
    new Tigre("Tigre"),
];

animales.forEach(animal => {
    animal.presentarse();
    animal.hacerSonido();
    console.log("------------------");
});
