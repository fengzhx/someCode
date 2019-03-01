/**
 * Created by admin on 18/3/28.
 */
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var iconv = require('iconv-lite');
var jschardet = require('jschardet');
const async = require('async');
var { ENCODE } = require('./Constants');
const xml2js = require('xml2js');
const readLine = require('readline');
const dateUtil = require('./DateUtil');

var file = {};

//递归创建目录 同步方法
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
/**
 * 拷贝一个或多个文件到目标路径下, 没必要使用异步方式
 * @param file
 * @param targetPath
 * @param callback
 */
file.copyFile = function (file, targetPath, callback) {
    fs.copyFile(file, targetPath,function (err,result) {
        callback(err,result);
    });
};

/**
 * 后期指定目录下所有已经文件目录
 * @param path 指定目录
 * @returns {Array}
 */
function getAllPathNames(path) {
    var filesList = fs.readdirSync(path);
    var list = [];
    filesList.forEach(function (itm, index) {
        var stat = fs.statSync(path + itm);
        if (stat.isDirectory() && itm[0]!='.') {
            list.push(itm);
        }
    });
    return list;
}


/***************************************递归查询目录或文件信息************************************/
/**
 * 返回指定目录下文件信息数组, 过滤掉隐藏文件
 * @param parentPath
 * @param callback
 */
file.getSubFileInfoList = function (parentPath, callback) {
    const fileArr = [];
    let subPath = '';
    const files = fs.readdirSync(parentPath);
    if (files.length === 0) callback(null, fileArr);
    files.forEach((item, index) => {
        subPath = path.join(parentPath, item);
        const stat  = fs.statSync(subPath);
        if (stat.isFile() && item.charAt(0) !== '.') fileArr.push({ name: item, size: stat.size });
        if (index === files.length - 1) callback(null, fileArr);
    });
};
/**
 * 返回指定目录下子目录大小, 过滤掉隐藏目录
 * @param parentPath
 * @param callback
 * @return { name: '', size: 123, path: '/absolute/path' } size单位是字节
 */
file.getSubDirInfoList = function (parentPath, callback) {
    const dirArr = [];
    const files = fs.readdirSync(parentPath);
    if (files.length === 0) return callback(null, dirArr);
    let count = files.length;
    files.forEach((item, index) => {
        const secondPath = path.join(parentPath, item); // 统计二级目录
        const stat = fs.statSync(secondPath);
        if (stat.isDirectory()) {
            file.getDirSize(secondPath, (err, size) => {
                if (err) {
                    callback(err, null);
                } else {
                    dirArr.push({ name: item, size: size, path: secondPath });
                    if (--count === 0) callback(null, dirArr);
                }
            });
        } else { // 第一级文件和隐藏内容不统计
            if (--count === 0) callback(null, dirArr);
        }
    });
};
/**
 * 指定目录大小: 递归该目录下所有文件大小, 忽略隐藏文件
 * 与fs模块统一, 返回字节数, 同步方式
 * @param dirPath
 * @param callback
 */
file.getDirSize = function (dirPath, callback) {
    let dirSize = 0; // 字节数
    let num = 0;
    const getSubDirSize = function (parentPath, callback) {
        const arr = fs.readdirSync(parentPath);
        if (arr.length === 0 && parentPath === dirPath) callback(null, 0); // 空目录;
        num += arr.length;
        arr.forEach((item, index) => {
            const subPath = path.join(parentPath, item);
            const stat = fs.statSync(subPath);
            if (stat.isDirectory()) {
                getSubDirSize(subPath, callback);
                if (--num === 0) callback(null, dirSize)
            } else if (item.charAt(0) !== '.') {
                dirSize += stat.size;
                if (--num === 0) callback(null, dirSize);
            } else { // 隐藏文件记为0
                if (--num === 0) callback(null, 0);
            } 
        });
    };
    getSubDirSize(dirPath, callback);
};
/**
 * 格式化文件大小
 * @param size 字节数
 * @param fmt K/M
 */
file.getSize = function (size, fmt) {
    let result = size + fmt;
    // 可改为正则匹配
    if (new RegExp('^[k|K][b|B]?$').test(fmt))
        result = Math.floor(size / 1024) + fmt;
    if (new RegExp('^[m|M][b|B]?$').test(fmt))
        result = Math.floor(size / 1024 / 1024) + fmt;
    return result;
};

/**
 * 拷贝目录到目标路径下, 没必要使用异步方式
 * @param sourceDir
 * @param targetPath
 * @param callback
 */
file.copyDirSync = function (sourceDir, targetPath, callback) {
    let num = 0;
    const copy = function (sourceDir, targetPath, callback) {
        const targetSubPath = path.join(targetPath, path.basename(sourceDir));
        if (mkdirsSync(targetSubPath)) {
            const arr = fs.readdirSync(sourceDir);
            num += arr.length;
            arr.forEach(item => {
                const subPath = path.join(sourceDir, item);
                const stat = fs.statSync(subPath);
                if (stat.isDirectory()) {
                    copy(subPath, targetSubPath, callback);
                    if (--num === 0) callback(null, true);
                } else if (stat.isFile() && item.charAt(0) !== '.') {
                    fs.copyFileSync(subPath, path.join(targetSubPath, item));
                    if (--num === 0) callback(null, true);
                } else {
                    if (--num === 0) callback(null, true);
                }
            });
        }
    }
    copy(sourceDir, targetPath, callback);
}



/**
 * 获取指定数月后的月份
 * @param month 年月 如：201709
 * @param num 指定月份数
 * @returns {number}
 */
function getMonthByNum(month,num) {
    var d = new Date(parseInt(month.substr(0,4)), parseInt(month.substr(4,2)), 1);
    // 因为getMonth()获取的月份的值只能在0~11之间所以我们在进行setMonth()之前先给其减一
    d.setMonth((d.getMonth()-1) + parseInt(num));
    var yy1 = d.getFullYear().toString();
    var mm1 = d.getMonth()+1;
    if (mm1 < 10 ) {
        mm1 = '0' + mm1;
    }
    return (yy1+mm1);
}
/**
 * 获取指定数月后的月份
 * @param month 年月 如：2017_09
 * @param num 指定月份数
 * @returns {number}
 */
function getMonthByNum1(month,num) {
    var d = new Date(parseInt(month.substr(0,4)), parseInt(month.substr(5,2)), 1);
    // 因为getMonth()获取的月份的值只能在0~11之间所以我们在进行setMonth()之前先给其减一
    d.setMonth((d.getMonth()-1) + parseInt(num));
    var yy1 = d.getFullYear().toString();
    var mm1 = d.getMonth()+1;
    if (mm1 < 10 ) {
        mm1 = '0' + mm1;
    }
    return (yy1+'-'+mm1);
}

/**
 * 获取前几天或后几天
 * @param d  日期 格式为20180909
 * @param num  正数为向后几天,负数为向前几天
 * @returns {string} 返回日期格式为yyyymmdd字符串
 */
function getMoreDay(d, num){
    d = d.substr(0,4)+'-'+d.substr(4,2)+'-'+d.substr(6,2);
    d = Date.parse(new Date(d));
    d = +d + num*1000*60*60*24;
    d = new Date(d);
    return d.getFullYear().toString()+((d.getMonth()+1)<=9?'0'+(d.getMonth()+1):(d.getMonth()+1).toString())+(d.getDate()<=9?'0'+(d.getDate()):d.getDate());
}

/**
 * 获取前几天或后几天
 * @param d  日期 格式为2018-09-09
 * @param num  正数为向后几天,负数为向前几天
 * @returns {string} 返回日期格式为yyyymmdd字符串
 */
function getMoreDay1(d, num){
    d = Date.parse(new Date(d));
    d = +d + num*1000*60*60*24;
    d = new Date(d);
    return d.getFullYear().toString()+'-'+((d.getMonth()+1)<=9?'0'+(d.getMonth()+1):(d.getMonth()+1).toString())+'-'
        +(d.getDate()<=9?'0'+(d.getDate()):d.getDate());
}

/**
 * 刷新指定数据源数据文件目录下所有待创建保存数据包目录
 * @param startDate 开始日期 年:2017  月:201708  日：20170809
 * @param dateUnit 周期建文件路径单位 年、月、日
 * @param dateNum 周期建文件路径周期数 数量
 * @param prefix 文件前缀
 * @param urlPath 建库路径
 */
file.addPathByDataSource = function (startDate,dateUnit,dateNum,prefix,urlPath) {
    var yearNum = 0;//计划多创建年份目录个数
    var monthNum = 1;//计划多创建月份目录个数
    var dayNum = 0;//计划多创建日目录个数
    mkdirsSync(urlPath);
    mkdirsSync(urlPath+'待登记数据包');
    mkdirsSync(urlPath+'待入库数据包');
    // var allDataPaths = getAllPathNames(urlPath);//数据源目录下所有保存数据包目录列表
    // //获取完整的日期
    // var date=new Date;//当前日期
    // var year=date.getFullYear().toString();//当前年份
    // var month=(date.getMonth()+1)<=9?('0'+(date.getMonth()+1)):(date.getMonth()+1).toString();//当前月份
    // var day = date.getDate()<=9?('0'+date.getDate()):date.getDate().toString();//当前日
    // var endDate = '';//结束日期
    // if(dateUnit==0){//日期单位为年
    //     endDate = (parseInt(year)+yearNum).toString();//可以设置预先创建目录个数
    //     while (startDate<=endDate){
    //         var nextDate = (parseInt(startDate)+parseInt(dateNum)-1).toString();
    //         var isKind = true;//是否存在待创建目录
    //         for(var i=0;i<allDataPaths.length;i++){
    //             if(allDataPaths[i]==prefix+ '_' +startDate+'_'+nextDate){//如果当前目录存在待创建目录则不再创建
    //                 isKind = false;
    //             }
    //         }
    //         if(isKind==true){
    //             mkdirsSync(urlPath+prefix+ '_' +startDate+'_'+nextDate);//创建待创建目录
    //         }
    //         startDate = (parseInt(startDate)+parseInt(dateNum)).toString();
    //     }
    // }else if(dateUnit==1){//日期单位为月
    //     endDate = year + month;
    //     endDate = getMonthByNum(endDate,monthNum);
    //     while (startDate<=endDate){
    //         var nextDate = getMonthByNum(startDate,dateNum-1);
    //         var isKind = true;//是否存在待创建目录
    //         for(var i=0;i<allDataPaths.length;i++){
    //             if(allDataPaths[i]==prefix+'_'+startDate+'_'+nextDate){//如果当前目录存在待创建目录则不再创建
    //                 isKind = false;
    //             }
    //         }
    //         if(isKind==true){
    //             mkdirsSync(urlPath+prefix+'_'+startDate+'_'+nextDate);
    //         }
    //         startDate = getMonthByNum(startDate,dateNum);
    //     }
    //
    // }else{//日期单位为日
    //     endDate = year + month + day;
    //     endDate = getMoreDay(endDate,dayNum);
    //     while (startDate<=endDate) {
    //         var nextDate = getMoreDay(startDate, dateNum - 1);
    //         var isKind = true;//是否存在待创建目录
    //         for (var i = 0; i < allDataPaths.length; i++) {
    //             if (allDataPaths[i] == prefix + '_' + startDate + '_' + nextDate) {//如果当前目录存在待创建目录则不再创建
    //                 isKind = false;
    //             }
    //         }
    //         if (isKind == true) {
    //             mkdirsSync(urlPath + prefix + '_' + startDate + '_' + nextDate);
    //         }
    //         startDate = getMoreDay(startDate, dateNum);
    //     }
    // }
};
/**
 * 获取数据包所在文件名称后缀，数据库名称后缀
 * @param startTime 数据开始时间
 * @param endTime  数据结束时间
 * @param startDate  开始日期
 * @param dateUnit 日期单位
 * @param dateNum 日期数量
 */
file.getPostfix = function (startTime,endTime,startDate,dateUnit,dateNum) {
    var nextDate = '';
    if(startTime>endTime){
        return [false,'起始时间大于结束时间'];
    }
    if(dateUnit==0){//日期单位为年
        while (nextDate<'3000'){
            nextDate = (parseInt(startDate)+parseInt(dateNum-1)).toString();
            if(startTime.substr(0,4)>=startDate && endTime.substr(0,4)<=nextDate){
                startDate = startDate.replace(/-/g,'');
                nextDate = nextDate.replace(/-/g,'');
                return [true,startDate+'_'+nextDate];
            }else if(startTime.substr(0,4)<startDate && endTime.substr(0,4)<startDate){
                return [false,'数据包时间不在规定起始时间之后'];
            }else if(startTime.substr(0,4)>=startDate && startTime.substr(0,4)<=nextDate && endTime.substr(0,4)>nextDate){
                return [false,'数据包时间跨界'];
            }else if(startTime.substr(0,4)<startDate || endTime.substr(0,4)<startDate){
                return [false,'数据包时间不在起始时间内'];
            }
            startDate = (parseInt(startDate)+parseInt(dateNum)).toString();
        }
    }else if(dateUnit==1){//日期单位为月
        while (nextDate<'3000-01'){
            nextDate = getMonthByNum1(startDate,dateNum-1);
            if(startTime.substr(0,7)>=startDate && endTime.substr(0,7)<=nextDate){
                startDate = startDate.replace(/-/g,'');
                nextDate = nextDate.replace(/-/g,'');
                return [true,startDate+'_'+nextDate];
            }else if(startTime.substr(0,7)<startDate && endTime.substr(0,7)<startDate){
                return [false,'数据包时间不在规定起始时间之后'];
            }else if(startTime.substr(0,7)>=startDate && startTime.substr(0,7)<=nextDate && endTime.substr(0,4)>nextDate){
                return [false,'数据包时间跨界'];
            }else if(startTime.substr(0,7)<startDate || endTime.substr(0,7)<startDate){
                return [false,'数据包时间不在起始时间内'];
            }
            startDate = getMonthByNum1(startDate,dateNum);
        }

    }else{//日期单位为日
        while (nextDate<'3000-01-01') {
            nextDate = getMoreDay1(startDate, dateNum - 1);
            if(startTime.substr(0,10)>=startDate && endTime.substr(0,10)<=nextDate){
                startDate = startDate.replace(/-/g,'');
                nextDate = nextDate.replace(/-/g,'');
                return [true,startDate+'_'+nextDate];
            }else if(startTime.substr(0,10)<startDate && endTime.substr(0,10)<startDate){
                return [false,'数据包时间不在规定起始时间之后'];
            }else if(startTime.substr(0,10)>=startDate && startTime.substr(0,10)<=nextDate && endTime.substr(0,10)>nextDate){
                return [false,'数据包时间跨界'];
            }else if(startTime.substr(0,10)<startDate || endTime.substr(0,10)<startDate){
                return [false,'数据包时间不在起始时间内'];
            }
            startDate = getMoreDay1(startDate, dateNum);
        }
    }
    return [false,'数据包时间太大，超出规定范围'];
};

function readFile(path,isChildern,filesList) {
    if(path[path.length-1]!='/'){
        path += '/';
    }
    if(!fs.existsSync(path)){
        console.log('错误的路径');
    }else{
        var files = fs.readdirSync(path);//需要用到同步读取
        files.forEach(walk);
        function walk(file)
        {
            var states = fs.statSync(path+'/'+file);
            if(states.isDirectory())
            {
                if(isChildern==true){
                    readFile(path+file,isChildern,filesList);
                }
            }
            else
            {
                //创建一个对象保存信息
                var obj = new Object();
                obj.size = states.size;//文件大小，以字节为单位
                obj.name = file;//文件名
                obj.path = path+file; //文件绝对路径
                filesList.push(obj);
            }
        }
    }
}
/**
 * 修改文件路径
 * @param sourceFile  源文件路径
 * @param destPath  目标文件路径
 * @param callback
 */
file.changeFilePath = function (sourceFile,destPath,callback) {
    console.log('开始修改文件路径');
    console.log(sourceFile);
    console.log(destPath);
    try{//判断源文件是否存在
        fs.accessSync(sourceFile,fs.F_OK);
    }catch(e){
        callback((sourceFile+'不存在'),null);return;
    }
    fs.rename(sourceFile, destPath, function (err,results) {//开始重命名文件路径
        console.log(err);
        console.log(results);
        if (err){
            callback(err,null);
        }else{
            callback(null,results);return;
        }
    });
}
/**
 * 根据路径读取该路径下所有文件信息
 * @param path 文件路径
 * @param isChildern  是否包含子文件夹
 * @param filesList 文件列表
 */
file.readFile = function(path,isChildern,filesList) {
    readFile(path,isChildern,filesList);
};


/**
 * 获取指定路径下所有文件路径信息
 * @param path
 * @param filesList
 */
file.readFilePath = function(path,filesList){
    var files = fs.readdirSync(path);//需要用到同步读取
    files.forEach(walk);
    function walk(file)
    {
        var states = fs.statSync(path+'/'+file);
        if(states.isDirectory())
        {
            filesList.push(states);
        }
    }
};

/************************************文件解压缩方法********************************************/
/*
 方法名：rar压缩
 参数：
 password
 zipFilePath
 srcFilePath
 例如：
 var password ="20170313",
 zipFilePath ="D:/test/18_20170313.rar",
 srcFilePath = "D:/test/18_20170313";
 cmdStr ="rar a -ep -P20170313 D:\test\18_20170313.rar D:\test\18_20170313"
 * */
file.rar = function(param,next){
    var cmdStr = 'rar a -ep -P '+param.password+' "'+param.zipFilePath+'" "'+param.srcFilePath+'" -y';
    console.log(">> cmdStr:",cmdStr);
    fs.exists(param.srcFilePath, function(exists) {  //判断路径是否存在
        if(exists) {
            exec(cmdStr,next);
        } else {
            next({
                code:400,
                msg:"源文件找不到"
            })
        }
    });
}

/*
 方法名：rar解压缩
 参数：
 password
 zipFilePath
 tgtFilePath
 例如：
 var param = {password:"20170313",
 zipFilePath:"D:/test/18_20170313.rar",
 srcFilePath:"D:/test/18_20170313"};
 cmdStr = "rar x -P20170313 D:\test\18_20170313.rar D:\test\18_20170313 -y"
 */
file.unrarFile = function(param,callback){
    var cmdStr = 'rar x "'+param.password+'" "'+param.zipFilePath+'" "'+param.srcFilePath+'" -y';
    console.log(cmdStr);
    fs.exists(param.srcFilePath, function(exists) {  //判断路径是否存在
        if(exists) {
            exec(cmdStr,function(err,stdout,stderr){  //执行命令行
                callback(err,stdout,stderr);
            });
        } else {
            fs.mkdir(param.srcFilePath,function(){  //创建目录
                exec(cmdStr,function(err,stdout,stderr){  //执行命令行
                    callback(err,stdout,stderr);
                });
            });
        }
    });
};



/**
 * 解压zip文件
 * @param param
 * var param = {
 * password:'909'
 * saveFilePath:'/user/123/345/'
 * sourceFilePath:'/user/123/345.zip'
 * }
 * @param next
 */
file.unZipFile = function (param,callback) {
    //解压压缩文件
    var cmdStr = 'unzip '+ param.password +' "'+ param.sourceFilePath +'" -d "'+ param.saveFilePath + '"';
    console.log(cmdStr);
    fs.exists(param.saveFilePath, function(exists) {  //判断路径是否存在
        if(exists) {
            exec(cmdStr,function(err,stdout,stderr){  //执行命令行
                console.log('解压zip文件成功');
                callback(err,stdout,stderr);
            });
        } else {
            fs.mkdir(param.saveFilePath,function(){  //创建目录
                exec(cmdStr,function(err,stdout,stderr){  //执行命令行
                    console.log('解压zip文件成功');
                    callback(err,stdout,stderr);
                });
            });
        }
    });
};
/**
 * 解压数据文件
 * @param password  密码
 * @param sourcePath 源压缩文件路径
 * @param savePath  保存路径
 * @param type 压缩类型 rar zip
 * @param callback
 */
file.unFile = function (password,sourcePath,savePath,type,callback) {
    if(type=='rar'){
        file.unrarFile({password:password, zipFilePath:sourcePath, srcFilePath:savePath},function (err,stdout,stderr) {
            callback(err,stdout,stderr);
        });
    }else if(type=='zip'){
        file.unZipFile({password:password, sourceFilePath:sourcePath, saveFilePath:savePath},function (err,stdout,stderr) {
            callback(err,stdout,stderr);
        });
    }
};

/**
 * 删除文件
 * @param name 文件名
 * @param path 文件所在路径
 * @param callback
 */
file.deleteFile = function(name,path,callback) {
    if(!fs.existsSync(path)){
        callback('{"seq":"","err":"错误的路径"}',null);
    }else{
        var filesList = fs.readdirSync(path);
        var isSame = false;
        for(var i=0;i<filesList.length;i++){
            if(filesList[i]==name){
                isSame = true;
            }
        }
        if(isSame==true){
            fs.unlinkSync(path+name);
            callback(null,{});
        }else{
            callback('{"seq":"","err":"不存在的文件"}',null);
        }
    }
};

/**
 * 获取rar压缩文件文件信息
 * @param filePath
 * @param callback
 */
file.unrarFileList = function(filePath,callback) {
    var cmdStr = "rar l -t "+ filePath;
    fs.exists(filePath, function(exists) {  //判断文件是否存在
        if(exists) {
            exec(cmdStr,function(err,stdout,stderr){  //执行命令行
                var fileArr1 = stdout.split('-------------------------------------------------------------------------------');
                var fileArr2 = [];
                if(fileArr1.length==1){
                    fileArr2 = [];
                }else{
                    fileArr2 = fileArr1[1].split('\n ');
                }
                var fileInfos = [];
                var num = 0;
                for(var i=1;i<fileArr2.length;i++) {
                    var fileArr3 = fileArr2[i].split(" ");
                    if (fileArr3[0].substr(0, 1) == '.' || fileArr3[0].split('.').length==1) {
                        continue;
                    }
                    var obj = {name: fileArr3[0]};
                    for (var j = 1; j < fileArr3.length; j++) {
                        if (fileArr3[j] != '' && fileArr3[j] != 0 && isNaN(fileArr3[j]) == false) {
                            obj.size = fileArr3[j];
                            fileInfos.push(obj);
                            num += parseInt(obj.fileSize);
                            break;
                        }
                    }
                }
                callback(fileInfos);
            });
        } else {
            console.log('不存在的目录');
        }
    });
};

file.createDir = function(path){
    var pathAry=path.split('/');
    for (var i=1;i<pathAry.length;i++){
        var curPath=pathAry.slice(0,i+1).join('/');
        var isExist = fs.existsSync(curPath);
        !isExist?fs.mkdirSync(curPath):null;
    }
};

//
// var cmdStr = 'unzip '+ saveFilePath + obj.filePath + '/"'+ fileName +'" -d '+ saveFilePath  + obj.filePath + '/'+'unzip/';
// exec(cmdStr, function(err,stdout,stderr){
//     if(err) {
//         console.log('get weather api error:'+stderr);
//     } else {
//         //解压完成，读取文件信息
//         var fileList = [];
//         if(!fs.existsSync(saveFilePath + obj.filePath + '/unzip/')){
//             fs.mkdir(saveFilePath + obj.filePath + '/unzip/');
//         }
//         readFile(saveFilePath + obj.filePath + '/unzip/' + fileNames[0] +'/',false,fileList);
//         fileInfo.fileNum = fileList.length;
//         callback(fileInfo);
//     }
// });


/************************************读取不同格式文件********************************************/

/**
 * 检测目标文件的编码方式
 * @param sourcePath
 * @param callback
 */
file.detectEncoding = function(sourcePath, callback) {
    const readStream = fs.createReadStream(sourcePath);
    readStream.on('data', function (chunk) {
        const result = jschardet.detect(chunk);
        if (result.confidence < .9) callback('无法准确获得文件编码格式', null);
        else {
            callback(null, result.encoding);
        }
        readStream.close();
    });
};
/**
 * 是getFileContent方法的中间产物
 * 先解析文件编码方式
 */
file.getReadStream = function (sourcePath, callback) {
    file.detectEncoding(sourcePath, function (err, encoding) {
        if (err) callback(err, null);
        else {
            let readStream = fs.createReadStream(sourcePath);
            if (sourceEncoding !== 'UTF-8')
                readStream = readStream.pipe(iconv.decodeStream(sourceEncoding));
            callback(null, readStream);
        }
    }); 
}
/**
 * 获得文件内容, 编码不是utf-8的要先借助iconv-lite转换
 * @param sourcePath 目标文件路径
 * @param callback
 */
file.getFileContent = function(sourcePath, callback) {
    file.detectEncoding(sourcePath, function (err, encoding) {
        if (err) callback(err, null);
        else {
            file.parseFileWithEncoding(sourcePath, encoding, callback);
        }
    });
};
/**
 * 标准编码方式的文件解析
 * @param sourcePath
 * @param sourceEncoding 目标文件编码方式, 要借助工具类去解析得到
 * @param callback
 */
file.parseFileWithEncoding = function (sourcePath, sourceEncoding, callback) {
    let readStream = fs.createReadStream(sourcePath);
    if (sourceEncoding !== 'UTF-8')
        readStream = readStream.pipe(iconv.decodeStream(sourceEncoding));
    let data = '';
    readStream.on('data', function (chunk) {
        data += chunk;
    });
    readStream.on('end', function () {
        // data = data.replace(/(?<=[\w]),/g,'"",');
        // console.log(data);
        callback(null, data);
    });
    readStream.on('error', function (err) {
        callback(err, null);
    });
};
/**
 * 将txt文件从ansi(gbk)转存为utf-8格式
 */
file.convertEncode = function (sourcePath, destPath, callback) {
    file.detectEncoding(sourcePath, (err, encode) => {
        if (err) callback(err, null);
        else {
            fs.createReadStream(sourcePath)
                .pipe(iconv.decodeStream(encode))
                .pipe(iconv.encodeStream('utf8'))
                .pipe(fs.createWriteStream(destPath));
            callback(null, destPath);
        }
    });
};


/**************************************解析描述文件内容*******************************************/
file.parseXml = function (filePath, callback) {
    if (!fs.existsSync(filePath)) return callback('Error 104: 文件未找到', null)
    fs.readFile(filePath, (err, data) => {
        if (err) {
            callback('Error 105: xml格式异常', null);
        } else {
            const parser = new xml2js.Parser();
            parser.parseString(data, (err, result) => {
                callback(err, result);
            });
        }
    });
}
/**
 * 逐行解析文件
 * @param filePath 
 * @param result 返回结果对象的初始化
 * @param lineFunc 
 * @param callback 
 */
file.fileReadLine = function (filePath, lineFunc, callback, result = {}) {
    async.auto({
        checkPath: function (callback) {
            if (!fs.existsSync(filePath)) callback('Error 104: 文件未找到', null)
            else callback(null, filePath);
        },
        getReadStream: ['checkPath', function (checkPath, callback) { // 将普通格式外的转化
            let rs = fs.createReadStream(filePath);
            if (path.extname(filePath) !== '.txt') {
                file.detectEncoding(filePath, function (err, encoding) {
                    if (err) callback('Error 105: 文件格式异常', null);
                    else {
                        rs = rs.pipe(iconv.decodeStream(encoding));
                        callback(null, rs);
                    }
                });
            } else {
                callback(null, rs);
            }
        }],
        readLine: ['getReadStream', function (rStream, callback) {
            rs = rStream['getReadStream'];
            const lineReader = readLine.createInterface({ input: rs });
            let lineErr = false;
            lineReader.on('line', line => {
                lineFunc(line, result, (err, parse) => {
                    if (err) {
                        !lineErr ? callback(err, null) : '';
                        lineErr = true;
                    } else {
                        result = parse;
                    }
                });
            } );
            lineReader.on('close', () => {
                try {
                    result.startTime = dateUtil.dateToStr('yyyy-MM-dd HH:mm:ss', dateUtil.strToDate(result.startTime));
                    result.endTime = dateUtil.dateToStr('yyyy-MM-dd HH:mm:ss', dateUtil.strToDate(result.endTime));
                    result.orgName = result.orgName || '';
                    result.infoArr = result.infoArr || [];
                    callback(null, result);
                } catch (err) {
                    callback('Error: 106: 文件解析出错', null)
                }
            });
        }]
    }, function (err, rsObj) {
        if (err) callback(err, null);
        else callback(null, rsObj['readLine']);
    });
}



module.exports=file;
