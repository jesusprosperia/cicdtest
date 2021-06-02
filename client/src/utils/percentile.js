import { sum, extent, cumsum, bisectLeft } from 'd3-array';

// 1d 
export function getValue(data, percent, priority, propName = 'criteria') {
    data = data.slice().sort((a, b) => {
        return a[propName] - b[propName];
    })

    if (priority == 'high') {
        data = data.slice().reverse();
    }

    var _sum = sum(data, d => d.sum);
    var percentSum = _sum * percent;
    var cumSum = cumsum(data, d => d.sum);
    var index = bisectLeft(cumSum, percentSum);
    
    if (priority == 'high') {
        return data[index] ? data[Math.max(0, index - 1)][propName] : data[0][propName];
    } else {
        return data[index] ? data[Math.max(0, index)][propName] : data[0][propName];
    }
}

// 2d
export function getValue2d(data2d, percent, priority) {
    // find all sum
    var _sum = sum(data2d, d => d.sum);
    
    // find a sum that we want to find
    var percentSum = _sum * percent;

    // find min and max criterias for each axis
    var extentX = extent(data2d, d => d.criteriaX);
    var extentY = extent(data2d, d => d.criteriaY);

    // find a correct corner
    var counterX = priority[0] == 'high' ? extentX[1] : extentX[0];
    var counterY = priority[1] == 'high' ? extentY[1] : extentY[0];

    // start search
    while (
        (counterX <= extentX[1] && counterX >= extentX[0]) ||
        (counterY <= extentY[1] && counterY >= extentY[0])
    ) { 
        var currentSum = sum(data2d, d => compare(d, counterX, counterY));

        if (currentSum > percentSum) {
            // correctly find previus criteria value
            var dx = priority[0] == 'high' ? 1 : -1;
            var dy = priority[1] == 'high' ? 1 : -1;

            // find a value with prevous y criteria
            var s1 = sum(data2d, d => compare(d, counterX, counterY + dy));

            // if still greater than, return previous x and y criterias
            if (s1 >= percentSum) {
                return [counterX + dx, counterY + dy];
            } 
            // else current x and prev y
            else {
                return [counterX, counterY + dy];
            }
        } else if (currentSum == percentSum) {
            return [counterX, counterY];
        }

        // add or subtract criteria depending on the criteria.
        // if priority is high, we need to subtract one and go left to get more sum,
        // if priotity is low, we need to add one and go right to get more sum.

        if (priority[0] == 'high') {
            if (counterX > extentX[0]) {
                counterX--;
            }
        } else {
            if (counterX < extentX[1]) {
                counterX++;
            }
        }

        if (priority[1] == 'high') {
            if (counterY > extentY[0]) {
                counterY--;
            }
        } else {
            if (counterY < extentY[1]) {
                counterY++;
            }
        }
    }

    function compare(d, _counterX, _counterY) {
        return (priority[0] == 'high' ? d.criteriaX >= _counterX : d.criteriaX <= _counterX) && 
               (priority[1] == 'high' ? d.criteriaY >= _counterY : d.criteriaY <= _counterY) ? d.sum : 0;
    }

    return [0, 0];
}