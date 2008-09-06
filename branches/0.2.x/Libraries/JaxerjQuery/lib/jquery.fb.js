
/* ***** BEGIN LICENSE BLOCK *****
 *  
 * This file is part of FirePHP (http://www.firephp.org/).
 * 
 * Copyright (C) 2007 Christoph Dorn
 * 
 * FirePHP is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * FirePHP is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with FirePHP.  If not, see <http://www.gnu.org/licenses/lgpl.html>.
 * 
 * ***** END LICENSE BLOCK ***** */
 

/**
 * Sends the given data to FirePHP Firefox Extension.
 * The data can be displayed in the Firebug Console or in the
 * "Server" request tab.
 * 
 * This jQuery plugin will only work in the Jaxer server environment.
 * See: http://www.aptana.com/jaxer/.
 * 
 * 
 * Usage:
 * 
 * <script src="http://code.jquery.com/jquery.js" runat="both"></script>
 * <script src="jquery.fb.js" runat="server"></script>
 * 
 * <script runat="server">
 * 
 *   jQuery.fb('Hello World');
 * 
 *   /* Register the global fb() function to reduce typing
 *      instead of always using jQuery.fb()
 *   jQuery.fbRegisterGlobal();
 * 
 *   fb('Hello World2');
 * 
 *   fb('Log message'  ,jQuery.FB_LOG);
 *   fb('Info message' ,jQuery.FB_INFO);
 *   fb('Warn message' ,jQuery.FB_WARN);
 *   fb('Error message',jQuery.FB_ERROR);
 * 
 *   fb('Message with label','Label',jQuery.FB_LOG);
 * 
 *   fb(Jaxer.request,'Jaxer.request',jQuery.FB_LOG);
 * 
 *   try {
 *     throw new Error('Test Exception');
 *   } catch(e) {
 *     fb(e);
 *   }
 * 
 *   fb(Jaxer.session,'Jaxer.session',jQuery.FB_DUMP);
 * 
 * </script>
 * 
 * 
 * @copyright   Copyright (C) 2007 Christoph Dorn
 * @author      Christoph Dorn <christoph@christophdorn.com>
 * @license     http://www.gnu.org/licenses/lgpl.html
 */

(function($){

  if(typeof(Jaxer)=='undefined' || Jaxer.isOnServer!=true) {
    throw new Error('The jquery.fb.js plugin will only work in the Jaxer server environment!');    
  }
  
  $.extend({
		
    FB_LOG: 'log',
    FB_INFO: 'info',
    FB_WARN: 'warn',
    FB_ERROR: 'error',
    FB_DUMP: 'dump',
    
    fb_index: 0,

 		fbRegisterGlobal: function() {
      
      window.fb = function(Object) {
        if(arguments.length==1) {
          return $.fb(Object);
        } else
        if(arguments.length==2) {
          return $.fb(Object,arguments[1]);
        } else
        if(arguments.length==3) {
          return $.fb(Object,arguments[1],arguments[2]);
        }
      }
    },
    
 		fb: function(Object) {
    
      var Type = null;

      if(arguments.length==1) {
      } else
      if(arguments.length==2) {
        switch(arguments[1]) {
          case this.FB_LOG:
          case this.FB_INFO:
          case this.FB_WARN:
          case this.FB_ERROR:
          case this.FB_DUMP:
            Type = arguments[1];
            break;
          default:
            Object = array(arguments[1],$Object);
            break;
        }
      } else
      if(arguments.length==3) {
        Type = arguments[2];
        Object = [arguments[1],Object];
      } else {
        throw 'Wrong number of arguments to fb() function!';
      }
    
    
      /* Check if FirePHP is installed on client */
      try {
        var v = Jaxer.request.headers['User-Agent'].match(/\sFirePHP\/([\.|\d]*)\s?/)[1].match(/(\d+)\.?(\d+)?\.?(\d+)?\.?(\d+)?/);
        if(v[0]==0 && v[1]==0 && v[2]<6) {    /* At least 0.0.6 */
          return false;
        }
      } catch(e) {
        return false;
      }
       
      if( Object instanceof Error ) {
        Object = Object.toString();
        if(Type==null) {
          Type = this.FB_ERROR;
        }
      } else {
        if(Type==null) {
          Type = this.FB_LOG;
        }
      }   
    
    	Jaxer.response.addHeader('X-FirePHP-Data-100000000001','{',true);
      if(Type==this.FB_DUMP) {
      	Jaxer.response.addHeader('X-FirePHP-Data-200000000001','"FirePHP.Dump":{',true);
      	Jaxer.response.addHeader('X-FirePHP-Data-299999999999','"__SKIP__":"__SKIP__"},',true);
      } else {
      	Jaxer.response.addHeader('X-FirePHP-Data-300000000001','"FirePHP.Firebug.Console":[',true);
      	Jaxer.response.addHeader('X-FirePHP-Data-399999999999','["__SKIP__"]],',true);
      }
    	Jaxer.response.addHeader('X-FirePHP-Data-999999999999','"__SKIP__":"__SKIP__"}',true);

      if(Type==this.FB_DUMP) {
      	msg = '"'+Object[0]+'":'+JSON.stringify(Object[1])+',';
      } else {
      	msg = '["'+Type+'",'+JSON.stringify(Object)+'],';
      }

      var date = null;
      var time = null;
      var offset = 0;
      var part = null;   
      
      while(true) {
       
        part = msg.substr(offset,5000);
        if(!part) break;
       
        date = new Date();
        time = pad(''+date.getSeconds(),2,'0',STR_PAD_LEFT)+''+pad(''+date.getMilliseconds(),3,'0',STR_PAD_LEFT)+''+pad(''+this.fb_index,6,'0',STR_PAD_LEFT);

    		Jaxer.response.addHeader('X-FirePHP-Data-'+((Type==this.FB_DUMP)?'2':'3')+time,part,true);
        
        offset += 5000;    
        this.fb_index++;
    	}
      
      return true;
    }
		
	})
  
    
  var STR_PAD_LEFT = 1;
  var STR_PAD_RIGHT = 2;
  var STR_PAD_BOTH = 3;
   
  function pad(str, len, pad, dir) {
   
  	if (typeof(len) == "undefined") { var len = 0; }
  	if (typeof(pad) == "undefined") { var pad = ' '; }
  	if (typeof(dir) == "undefined") { var dir = STR_PAD_RIGHT; }
   
  	if (len + 1 >= str.length) {
   
  		switch (dir){
   
  			case STR_PAD_LEFT:
  				str = Array(len + 1 - str.length).join(pad) + str;
  			break;
   
  			case STR_PAD_BOTH:
  				var right = Math.ceil((padlen = len - str.length) / 2);
  				var left = padlen - right;
  				str = Array(left+1).join(pad) + str + Array(right+1).join(pad);
  			break;
   
  			default:
  				str = str + Array(len + 1 - str.length).join(pad);
  			break;
   
  		} // switch
   
  	}
   
  	return str;
   
  }  
    
  /*
      http://www.JSON.org/json2.js
      2008-03-24
  
      Public Domain.
  
      NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
  
      See http://www.JSON.org/js.html
  
      This file creates a global JSON object containing three methods: stringify,
      parse, and quote.
  
  
          JSON.stringify(value, replacer, space)
              value       any JavaScript value, usually an object or array.
  
              replacer    an optional parameter that determines how object
                          values are stringified for objects without a toJSON
                          method. It can be a function or an array.
  
              space       an optional parameter that specifies the indentation
                          of nested structures. If it is omitted, the text will
                          be packed without extra whitespace. If it is a number,
                          it will specify the number of spaces to indent at each
                          level. If it is a string (such as '\t'), it contains the
                          characters used to indent at each level.
  
              This method produces a JSON text from a JavaScript value.
  
              When an object value is found, if the object contains a toJSON
              method, its toJSON method will be called and the result will be
              stringified. A toJSON method does not serialize: it returns the
              value represented by the name/value pair that should be serialized,
              or undefined if nothing should be serialized. The toJSON method will
              be passed the key associated with the value, and this will be bound
              to the object holding the key.
  
              This is the toJSON method added to Dates:
  
                  function toJSON(key) {
                      return this.getUTCFullYear()   + '-' +
                           f(this.getUTCMonth() + 1) + '-' +
                           f(this.getUTCDate())      + 'T' +
                           f(this.getUTCHours())     + ':' +
                           f(this.getUTCMinutes())   + ':' +
                           f(this.getUTCSeconds())   + 'Z';
                  }
  
              You can provide an optional replacer method. It will be passed the
              key and value of each member, with this bound to the containing
              object. The value that is returned from your method will be
              serialized. If your method returns undefined, then the member will
              be excluded from the serialization.
  
              If no replacer parameter is provided, then a default replacer
              will be used:
  
                  function replacer(key, value) {
                      return Object.hasOwnProperty.call(this, key) ?
                          value : undefined;
                  }
  
              The default replacer is passed the key and value for each item in
              the structure. It excludes inherited members.
  
              If the replacer parameter is an array, then it will be used to
              select the members to be serialized. It filters the results such
              that only members with keys listed in the replacer array are
              stringified.
  
              Values that do not have JSON representaions, such as undefined or
              functions, will not be serialized. Such values in objects will be
              dropped; in arrays they will be replaced with null. You can use
              a replacer function to replace those with JSON values.
              JSON.stringify(undefined) returns undefined.
  
              The optional space parameter produces a stringification of the value
              that is filled with line breaks and indentation to make it easier to
              read.
  
              If the space parameter is a non-empty string, then that string will
              be used for indentation. If the space parameter is a number, then
              then indentation will be that many spaces.
  
              Example:
  
              text = JSON.stringify(['e', {pluribus: 'unum'}]);
              // text is '["e",{"pluribus":"unum"}]'
  
  
              text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
              // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'
  
  
          JSON.parse(text, reviver)
              This method parses a JSON text to produce an object or array.
              It can throw a SyntaxError exception.
  
              The optional reviver parameter is a function that can filter and
              transform the results. It receives each of the keys and values,
              and its return value is used instead of the original value.
              If it returns what it received, then the structure is not modified.
              If it returns undefined then the member is deleted.
  
              Example:
  
              // Parse the text. Values that look like ISO date strings will
              // be converted to Date objects.
  
              myData = JSON.parse(text, function (key, value) {
                  var a;
                  if (typeof value === 'string') {
                      a =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                      if (a) {
                          return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                              +a[5], +a[6]));
                      }
                  }
                  return value;
              });
  
  
          JSON.quote(text)
              This method wraps a string in quotes, escaping some characters
              as needed.
  
  
      This is a reference implementation. You are free to copy, modify, or
      redistribute.
  
      USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD THIRD PARTY
      CODE INTO YOUR PAGES.
  */
  
  /*jslint regexp: true, forin: true, evil: true */
  
  /*global JSON */
  
  /*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
      call, charCodeAt, floor, getUTCDate, getUTCFullYear, getUTCHours,
      getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join, length,
      parse, propertyIsEnumerable, prototype, push, quote, replace, stringify,
      test, toJSON, toString
  */
  
  if (!this.JSON) {
  
  // Create a JSON object only if one does not already exist. We create the
  // object in a closure to avoid global variables.
  
      JSON = function () {
  
          function f(n) {    // Format integers to have at least two digits.
              return n < 10 ? '0' + n : n;
          }
  
          Date.prototype.toJSON = function () {
  
  // Eventually, this method will be based on the date.toISOString method.
  
              return this.getUTCFullYear()   + '-' +
                   f(this.getUTCMonth() + 1) + '-' +
                   f(this.getUTCDate())      + 'T' +
                   f(this.getUTCHours())     + ':' +
                   f(this.getUTCMinutes())   + ':' +
                   f(this.getUTCSeconds())   + 'Z';
          };
  
  
          var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g,
              gap,
              indent,
              meta = {    // table of character substitutions
                  '\b': '\\b',
                  '\t': '\\t',
                  '\n': '\\n',
                  '\f': '\\f',
                  '\r': '\\r',
                  '"' : '\\"',
                  '\\': '\\\\'
              },
              rep;
  
  
          function quote(string) {
  
  // If the string contains no control characters, no quote characters, and no
  // backslash characters, then we can safely slap some quotes around it.
  // Otherwise we must also replace the offending characters with safe escape
  // sequences.
  
              return escapeable.test(string) ?
                  '"' + string.replace(escapeable, function (a) {
                      var c = meta[a];
                      if (typeof c === 'string') {
                          return c;
                      }
                      c = a.charCodeAt();
                      return '\\u00' + Math.floor(c / 16).toString(16) +
                                                 (c % 16).toString(16);
                  }) + '"' :
                  '"' + string + '"';
          }
  
  
          function str(key, holder) {
  
  // Produce a string from holder[key].
  
              var i,          // The loop counter.
                  k,          // The member key.
                  v,          // The member value.
                  length,
                  mind = gap,
                  partial,
                  value = holder[key];
  
  // If the value has a toJSON method, call it to obtain a replacement value.
  
              if (value && typeof value === 'object' &&
                      typeof value.toJSON === 'function') {
                  value = value.toJSON(key);
              }
  
  // If we were called with a replacer function, then call the replacer to
  // obtain a replacement value.
  
              if (typeof rep === 'function') {
                  value = rep.call(holder, key, value);
              }
  
  // What happens next depends on the value's type.
  
              switch (typeof value) {
              case 'string':
                  return quote(value);
  
              case 'number':
  
  // JSON numbers must be finite. Encode non-finite numbers as null.
  
                  return isFinite(value) ? String(value) : 'null';
  
              case 'boolean':
              case 'null':
  
  // If the value is a boolean or null, convert it to a string. Note:
  // typeof null does not produce 'null'. The case is included here in
  // the remote chance that this gets fixed someday.
  
                  return String(value);
  
  // If the type is 'object', we might be dealing with an object or an array or
  // null.
  
              case 'object':
  
  // Due to a specification blunder in ECMAScript, typeof null is 'object',
  // so watch out for that case.
  
                  if (!value) {
                      return 'null';
                  }
  
  // Make an array to hold the partial results of stringifying this object value.
  
                  gap += indent;
                  partial = [];
  
  // If the object has a dontEnum length property, we'll treat it as an array.
  
                  if (typeof value.length === 'number' &&
                          !(value.propertyIsEnumerable('length'))) {
  
  // The object is an array. Stringify every element. Use null as a placeholder
  // for non-JSON values.
  
                      length = value.length;
                      for (i = 0; i < length; i += 1) {
                          partial[i] = str(i, value) || 'null';
                      }
  
  // Join all of the elements together, separated with commas, and wrap them in
  // brackets.
  
                      v = partial.length === 0 ? '[]' :
                          gap ? '[\n' + gap + partial.join(',\n' + gap) +
                                    '\n' + mind + ']' :
                                '[' + partial.join(',') + ']';
                      gap = mind;
                      return v;
                  }
  
  // If the replacer is an array, use it to select the members to be stringified.
  
                  if (typeof rep === 'object') {
                      length = rep.length;
                      for (i = 0; i < length; i += 1) {
                          k = rep[i];
                          if (typeof k === 'string') {
                              v = str(k, value, rep);
                              if (v) {
                                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
                              }
                          }
                      }
                  } else {
  
  // Otherwise, iterate through all of the keys in the object.
  
                      for (k in value) {
                          v = str(k, value, rep);
                          if (v) {
                              partial.push(quote(k) + (gap ? ': ' : ':') + v);
                          }
                      }
                  }
  
  // Join all of the member texts together, separated with commas,
  // and wrap them in braces.
  
                  v = partial.length === 0 ? '{}' :
                      gap ? '{\n' + gap + partial.join(',\n' + gap) +
                                '\n' + mind + '}' :
                            '{' + partial.join(',') + '}';
                  gap = mind;
                  return v;
              }
          }
  
  
  // Return the JSON object containing the stringify, parse, and quote methods.
  
          return {
              stringify: function (value, replacer, space) {
  
  // The stringify method takes a value and an optional replacer, and an optional
  // space parameter, and returns a JSON text. The replacer can be a function
  // that can replace values, or an array of strings that will select the keys.
  // A default replacer method can be provided. Use of the space parameter can
  // produce text that is more easily readable.
  
                  var i;
                  gap = '';
                  indent = '';
                  if (space) {
  
  // If the space parameter is a number, make an indent string containing that
  // many spaces.
  
                      if (typeof space === 'number') {
                          for (i = 0; i < space; i += 1) {
                              indent += ' ';
                          }
  
  // If the space parameter is a string, it will be used as the indent string.
  
                      } else if (typeof space === 'string') {
                          indent = space;
                      }
                  }
  
  // If there is no replacer parameter, use the default replacer.
  
                  if (!replacer) {
                      rep = function (key, value) {
                          if (!Object.hasOwnProperty.call(this, key)) {
                              return undefined;
                          }
                          return value;
                      };
  
  // The replacer can be a function or an array. Otherwise, throw an error.
  
                  } else if (typeof replacer === 'function' ||
                          (typeof replacer === 'object' &&
                           typeof replacer.length === 'number')) {
                      rep = replacer;
                  } else {
                      throw new Error('JSON.stringify');
                  }
  
  // Make a fake root object containing our value under the key of ''.
  // Return the result of stringifying the value.
  
                  return str('', {'': value});
              },
  
  
              parse: function (text, reviver) {
  
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.
  
                  var j;
  
                  function walk(holder, key) {
  
  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.
  
                      var k, v, value = holder[key];
                      if (value && typeof value === 'object') {
                          for (k in value) {
                              if (Object.hasOwnProperty.call(value, k)) {
                                  v = walk(value, k);
                                  if (v !== undefined) {
                                      value[k] = v;
                                  } else {
                                      delete value[k];
                                  }
                              }
                          }
                      }
                      return reviver.call(holder, key, value);
                  }
  
  
  // Parsing happens in three stages. In the first stage, we run the text against
  // regular expressions that look for non-JSON patterns. We are especially
  // concerned with '()' and 'new' because they can cause invocation, and '='
  // because it can cause mutation. But just to be safe, we want to reject all
  // unexpected forms.
  
  // We split the first stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace all backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
  
                  if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
  replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
  replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
  
  // In the second stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.
  
                      j = eval('(' + text + ')');
  
  // In the optional third stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.
  
                      return typeof reviver === 'function' ?
                          walk({'': j}, '') : j;
                  }
  
  // If the text is not JSON parseable, then a SyntaxError is thrown.
  
                  throw new SyntaxError('JSON.parse');
              },
  
              quote: quote
          };
      }();
  }
  
  
})(jQuery);