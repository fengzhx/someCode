router.post('/doUpload/:userId', function (req, res, next) {
    let userId = req.params.userId;
    let form = formidable.IncomingForm();
    let targetDir = path.join(__dirname, './../../uploads/import');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
    }
    form.uploadDir = targetDir;
    form.keepExtensions = true;
    form.parse(req, function (err, fields, file) {
        file = file.file;
        console.log(file);
        let fileExt = file.path.substring(file.path.lastIndexOf("."));
        if('.txt' != fileExt){
            fs.unlinkSync(file.path);
            res.send('此文件类型不能上传');
        }else{
            let targetFile = path.join(targetDir,file.name);
            fs.renameSync(file.path,targetFile);
            fs.readFile(targetFile,'utf-8',function (err,result) {
                if(err){
                    res.send(err);
                }else{
                    let judgeFormat = result.substring(result.length - 3);
                    if(judgeFormat != '@@@'){
                        res.send('文件出现问题');
                    }else{
                        let params = {};
                        params.data = result;
                        params.userId = userId;
                        //这里也可以fs.readFile
                        dataStorageService.importDateSourceAuditInformation(params, (data) => {
                            res.send(data);
                        });
                    }
                }
            })
        }
    });
});