/**
 * 字符串相似度
 * @param char1 字符串1
 * @param char2 字符串2
 * @returns {number} 相似度
 */
function similarityDegree(char1,char2){
    let a = "0"+ char1;
    let b = "0"+ char2;
    let distance = [];

    for (let i = 0;i<a.length;i++){
        distance[i] = [];
        for(let j = 0;j<b.length;j++){
            distance[i][j] = Math.max(i,j);
        }
    }

    for (let i = 1;i<a.length;i++){
        for(let j = 1;j<b.length;j++){
            if(a[i] == b[j]){
                let temp1 = distance[i-1][j]+1;
                let temp2 = distance[i][j-1]+1;
                distance[i][j] = Math.min(temp1,temp2,distance[i-1][j-1]);
            }else if(a[i] != b[j]){
                let temp1 = distance[i-1][j]+1;
                let temp2 = distance[i][j-1]+1;
                distance[i][j] = Math.min(temp1,temp2,distance[i-1][j-1]+1);
            }
        }
    }
    let degree = 1 - distance[a.length-1][b.length-1]/Math.max(a.length-1,b.length-1);
    return Number(degree.toFixed(2));
}
