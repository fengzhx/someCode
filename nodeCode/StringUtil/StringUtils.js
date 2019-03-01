/**
 * Created by Fly on 2016-03-03.
 */

var StringUtils = function(){
    /************************************字符处理**********************************/
    /*  替换字符串
     @str        要处理的字符集
     @oldStr        原字符
     @newStr     新字符
     */
    this.Replace = function (str,oldStr,newStr)
    {
        var reg = eval("/"+oldStr+"/g");
        return str.replace(reg,newStr);
    }
    /*  取左边的指定长度的值
     @str        要处理的字符集
     @n            长度
     */
    this.Left = function (str,n)
    {
        if(str.length > 0)
        {
            if(n>str.length) n = str.length;
            return str.substr(0,n)
        }
        else
        {
            return;
        }
    }
    /*  取右边的指定长度的值
     @str        要处理的字符集
     @n            长度
     */
    this.Right = function (str,n)
    {
        if(str.length > 0)
        {
            if(n>=str.length) return str;
            return str.substr(str.length-n,n);
        }
        else
        {
            return;
        }
    }
    /*  Trim:清除两边空格
     @str        要处理的字符集
     */
    this.Trim = function (str)
    {
        if (typeof str == 'string') return str.replace(/(^\s*)|(\s*$)/g, '');
    }

    /*  LTrim:清除左边的空格
     @str        要处理的字符集
     */
    this.LTrim = function (str)
    {
        if (typeof str == 'string') return str.replace(/(^\s*)/g, '');
    }

    /*  RTrim: 清除右边的空格
     @str        要处理的字符集
     */
    this.RTrim = function (str)
    {
        if (typeof str == 'string') return str.replace(/(\s*$)/g, '');
    }
    /*  清除前后的非字符
     @str        要处理的字符集
     */
    this.Strip = function (str) {
        if (typeof str == 'string') return str.replace(/^\s+/, '').replace(/(^\s*)|(\s*$)/g, '');
    }
    /*  过滤字符里面的HTML标签
     @str        要处理的字符集
     */
    this.StripTags = function (str) {
        if (typeof str == 'string')return str.replace(/<\/?[^>]+>/gi, '').replace(/(^\s*)|(\s*$)/g, '');
    }
    /***********************************验证类函数**********************************/
    /*  检测字符长度
     @str        字符集
     @s          开始长度
     @l          结束长度
     */
    this.IsLen = function (str,s,l){
        str=this.Trim(str)
        if(str.length>s && str.length<l){
            return true;
        }
        else{
            return false;
        }
    }
    /*  是否是数字型数据
     @str        字符集
     */
    this.IsNumber = function (str){
        if (/^\d+$/.test(str)){return true;}else{return false;}
    }
    /*  是否是自然数型数据
     @str        字符集
     */
    this.IsInt = function (str){
        if (/^(\+|-)?\d+$/.test(str)){return true;}else{return false;}
    }
    /*  是否是中文字符
     @str        字符集
     */
    this.IsChinese = function (str)
    {
        if (/^[\一-\龥]+$/.test(str)){return true;}else{return false;}
    }
    /*是否为字母和数字（字符集）*/
    this.IsLetters = function (str)
    {
        if (/^[A-Za-z0-9]+$/.test(str)){return true;}else{return false;}
    }
    /*是否为英文字母（字符集）*/
    this.IsLetter = function (str)
    {
        if (/^[A-Za-z]+$/.test(str)){return true;}else{return false;}
    }
    /*是否为大写字母（字符集）*/
    this.IsUpper = function (str)
    {
        if (/^[A-Z]+$/.test(str)){return true;}else{return false;}
    }
    /*是否为小写字母（字符集）*/
    this.IsLower = function (str)
    {
        if (/^[a-z]+$/.test(str)){return true; }else{return false;}
    }
    /*  是否为正确的网址
     @str        字符集
     */
    this.IsUrl = function (str)
    {
        var myReg = /^((http:[/][/])?\w+([.]\w+|[/]\w*)*)?$/;
        if(myReg.test(str)){return true;}else{return false;}
    }
    /*  是否为正确的Email形式
     @str        字符集
     */
    this.IsEmail = function (str)
    {
        var myReg = /^([-_A-Za-z0-9\.]+)@([_A-Za-z0-9]+\.)+[A-Za-z0-9]{2,3}$/;
        if(myReg.test(str)){return  str;}else{return false;}
    }
    /*  是否为正确的手机号码
     @str        字符集
     */
    this.IsMobile = function (str)
    {
        var regu =/(^[1][3][0-9]{9}$)|(^0[1][3][0-9]{9}$)/;
        var re = new RegExp(regu);
        if (re.test(str)){return str;}else{return false;}
    }
    /*
    excel表格字母列号转为数字 数字从0开始  //字母数限制为2个
    @str    excel字母列号
     */
    this.ExcelColumnCharToNum= function(str)
    {
        if(str==''||str=='undefined'||str==null)
        return -1;
        var len=str.length;
        if(len==1)
        {
            if(str<'A'|| str>'Z')
                return -1;

            return str.charCodeAt()-65;
        }
        else if(len==2){
            if(str[0]<'A'|| str[0] >'Z' || str[1] < 'A' || str[1] > 'Z')
            {
                return -1;
            }
            var row=str[0].charCodeAt()-65+1;
            var x=str[1].charCodeAt()-65+1;
            var totalColumn=row*26+x;
            return totalColumn-1;
        }
        else{
            return -1;
        }
    }

    return this;
};
var stringUtils = new StringUtils();
module.exports = stringUtils;