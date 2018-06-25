export { };

declare global {
    interface Date {
        addHours(hours: number): Date;
    }
}

Date.prototype.addHours = function(hours: number) {
    this.setHours(this.getHours() + hours);
    return this;
};
