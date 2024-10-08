/* eslint-disable */
import PassportAccess from "./passport-access.js";

class UserEntitlement extends PassportAccess {
  static p;
  static accessCache = {};

  static setEntity(entity) {
    this.p = new this(entity);
    this.accessCache = {};
  }

  static hasAccess(resourcePath, permission, selectedBotId) {
    const key = `${resourcePath}-${permission}`
    if (this.accessCache[key] === undefined) {
      this.accessCache[key] = this.p?.hasAccess(resourcePath, permission, selectedBotId);
      console.log(`hasAccess called: ${resourcePath} | ${permission} = `, this.accessCache[key])
    }
    return this.accessCache[key]
  }
    
  static setCurrentBotId(botId) { 
     this.p.setCurrentBotId(botId)
  }

  static summarize() {
    return this.p.summarize();
  }
  static summarizePolicy() {
    return this.p.summarizePolicy();
  }
  
  static exists() {
    return this.p?.exists();
  }

  static isPassportAdmin()  {
    return this.p?.isPassportAdmin()
  }

  static analyze() {
    return this.p.getAnalyzePath();
  }
}

export default UserEntitlement;