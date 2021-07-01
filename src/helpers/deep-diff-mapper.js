import logger from "loglevel";

/**
 * Find differences between two Objects
 */
const deepDiffMapper = (function() {
  return {
    VALUE_CREATED: "created",
    VALUE_UPDATED: "updated",
    VALUE_DELETED: "deleted",
    VALUE_UNCHANGED: "unchanged",
    map: function(newObj, oldObj) {
      if (this.isFunction(newObj) || this.isFunction(oldObj)) {
        throw "Invalid argument. Function given, object expected.";
      }
      if (this.isValue(newObj) || this.isValue(oldObj)) {
        const compareResult = this.compareValues(newObj, oldObj);

        // if (compareResult === "created" || compareResult === "updated") {
        //   logger.log("[deepDiffMapper] changed obj1", newObj, "obj2", oldObj);
        // }

        return {
          type: compareResult,
          data: newObj === undefined ? oldObj : newObj,
        };
      }

      var diff = {};
      for (var key in newObj) {
        if (this.isFunction(newObj[key])) {
          continue;
        }

        var value2 = undefined;
        if (oldObj[key] !== undefined) {
          value2 = oldObj[key];
        }

        diff[key] = this.map(newObj[key], value2);
      }
      for (var key in oldObj) {
        if (this.isFunction(oldObj[key]) || diff[key] !== undefined) {
          continue;
        }

        diff[key] = this.map(undefined, oldObj[key]);
      }

      return diff;
    },
    compareValues: function(value1, value2) {
      if (value1 === value2) {
        return this.VALUE_UNCHANGED;
      }
      if (
        this.isDate(value1) &&
        this.isDate(value2) &&
        value1.getTime() === value2.getTime()
      ) {
        return this.VALUE_UNCHANGED;
      }
      if (value2 === undefined) {
        return this.VALUE_CREATED;
      }
      if (value1 === undefined) {
        return this.VALUE_DELETED;
      }
      return this.VALUE_UPDATED;
    },
    isFunction: function(x) {
      return Object.prototype.toString.call(x) === "[object Function]";
    },
    isArray: function(x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    },
    isDate: function(x) {
      return Object.prototype.toString.call(x) === "[object Date]";
    },
    isObject: function(x) {
      return Object.prototype.toString.call(x) === "[object Object]";
    },
    isValue: function(x) {
      return !this.isObject(x) && !this.isArray(x);
    },
    isDiffValue: function(x) {
      return this.isObject(x) && Object.keys(x).length === 2 && Object.keys(x).find(key => key === 'data') && Object.keys(x).find(key => key === 'type');
    },
    isEmptyObject: function(x) {
      return JSON.stringify(x) === JSON.stringify({});
    },
    hasChanges: function(obj) {
      let hasChanges = false;

      if (this.isObject(obj)) {
        if (obj.type) {
          if (
            obj.type !== this.VALUE_UNCHANGED
          ) {
            return true;
          }

          return false;
        }

        Object.keys(obj).forEach((key) => {
          if (this.hasChanges(obj[key])) {
            hasChanges = true;
          }
        });
      }

      if (this.isArray(obj)) {
        obj.forEach((obj2) => {
          if (this.hasChanges(obj2)) {
            hasChanges = true;
          }
        });
      }

      return hasChanges;
    },

    prune(obj) {
      // logger.log('[prune] obj:', obj);
      
      if (this.isObject(obj)) {
        const keys = Object.keys(obj);

        keys.forEach(key => {
          const subObj = obj[key];

          if (this.isDiffValue(subObj) || this.isArray(subObj)) {
            if (!this.hasChanges(subObj)) {
              delete obj[key];
            }
          }

          if (this.isArray(subObj)) {
            subObj.forEach(subObj2 => {
              this.prune(subObj2);
            })
          }

          if (this.isObject(subObj)) {
            this.prune(subObj);
            if (this.isEmptyObject(subObj)) {
              delete obj[key];
            }
          }
        })
      }

      return obj;
    }
  };
})();

export { deepDiffMapper };
