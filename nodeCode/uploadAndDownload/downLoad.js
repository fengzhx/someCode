router.get('/exportDataStorageCheckInfo',function (req,res) {/
    let packageId = req.query.packageId;
    let userId = req.query.userId;
    let packageIds = packageId.split(',');
    dataStorageService.exportDataStorageCheckInfo(packageIds,userId,function (data) {
        data = JSON.parse(data);
        if(data.eid != 0){
            res.send(data);
        }else{
            res.download(data.exportPath,"export.txt",function (err) {
                if(err){
                    console.log(err);
                }else{
                    console.log("成功");
                }
            })
        }
    })
});