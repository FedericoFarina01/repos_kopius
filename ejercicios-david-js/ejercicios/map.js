// Map
const numbers = [1, 2, 3, 4];

const mapNumbers = numbers.map((number)=>
    number * number)

console.log(mapNumbers);

// Filter
const numbersFiltrados = mapNumbers.filter((number) => number > 4);

console.log(numbersFiltrados); 


//Reduce
const numbersReduce = numbersFiltrados.reduce((suma, numeroActual) => {

    return suma + numeroActual;
}, 0);

console.log(numbersReduce); 