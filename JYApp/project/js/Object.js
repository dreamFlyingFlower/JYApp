Object.prototype.remove = function(prop){
	if(this[prop] !== undefined){
		var del = this[prop];
		delete this[prop];
		return del;
	} else{ 
		return undefined;
	}
}
Object.prototype.size = function(){
	var size=0;
	for(var prop in this){
		if(this.hasOwnProperty(prop)){
			size++;
		}
	}
	return size;
}
/**
 * 获取对象所有的key值,由于对对象原型做了修改,使得修改后的原型会带有修改方法,需使用hasOwnProperty检查对象实例中是否存在该对象实例属性,而不是对象原型
 * for-in方法会检查对象原型中所有的属性,而不是对象实例的所有属性
 */
Object.prototype.getKeys = function(){
	var keyArr = [];
	for(var prop in this){
		if(this.hasOwnProperty(prop)){			
			keyArr.push(prop);
		}
	}
	return keyArr;
}
Object.prototype.getVals = function(){
	var valArr = [];
	for(var prop in this){
		if(this.hasOwnProperty(prop)){			
			valArr.push(this[prop]);
		}
	}
	return valArr;
}