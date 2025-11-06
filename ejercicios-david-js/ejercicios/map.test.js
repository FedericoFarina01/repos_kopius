// Tests para las funciones de map.js siguiendo el modelo ISOLATION / GWT / WSH

class ArrayOperations {
    mapNumbers(numbers) {
        return numbers.map((number) => number * number);
    }

    filterNumbers(mapNumbers, valorMinimo) {
        return mapNumbers.filter((number) => number > valorMinimo);
    }

    reduceNumbers(numbersFiltrados) {
        return numbersFiltrados.reduce((suma, numeroActual) => {
            return suma + numeroActual;
        }, 0);
    }
}

describe("ArrayOperations", () => {
    let arrayOperations;

    beforeEach("", () => {
        arrayOperations = new ArrayOperations();
    });

    describe("mapNumbers", () => {
        it("Cuando envio un array de numeros a mapNumbers deberia devolver cada numero al cuadrado", () => {
            // Given
            let numbers = [1, 2, 3, 4];

            // When
            const mapNumbers = arrayOperations.mapNumbers(numbers);

            // Then
            expect(mapNumbers).toEqual([1, 4, 9, 16]);
        });
    });

    describe("filterNumbers", () => {
        it("Cuando filtro numeros mayores a 4 deberia devolver solo los que cumplen la condicion", () => {
            // Given
            let mapNumbers = [1, 4, 9, 16];
            let valorMinimo = 4;

            // When
            const numbersFiltrados = arrayOperations.filterNumbers(mapNumbers, valorMinimo);

            // Then
            expect(numbersFiltrados).toEqual([9, 16]);
        });
    });

    describe("reduceNumbers", () => {
        it("Cuando sumo los numeros de un array con reduce deberia devolver la suma total", () => {
            // Given
            let numbersFiltrados = [9, 16];

            // When
            const numbersReduce = arrayOperations.reduceNumbers(numbersFiltrados);

            // Then
            expect(numbersReduce).toBe(25);
        });
    });
});
