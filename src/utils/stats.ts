
type StatItem = {
    identifier: string;
    label: string;
    value: any;
    group: string;
}
class Stats {
    
    static stats: StatItem[] = [];

    static set(data: StatItem) {
        const index = this.stats.findIndex((stat) => stat.identifier === data.identifier);
        if (index === -1) {
            this.stats.push(data);
        
        } else {
            if(this.stats[index].value === data.value) return;
            this.stats[index] = data;
        }
        Stats.display();
    }

    static get(identifier: string) {
        return this.stats.find((stat) => stat.identifier === identifier);
    }

    static getAll() {
        return this.stats;
    }

    static remove(identifier: string) {
        const index = this.stats.findIndex((stat) => stat.identifier === identifier);
        if (index !== -1) {
            this.stats.splice(index, 1);
        }
    }

    static removeGroup(group: string) {
        this.stats = this.stats.filter((stat) => stat.group !== group);
    }

    static display(){
        console.clear();
        Stats.getAll().forEach((stat) => {
            console.log(`[${stat.group}] ${stat.label}: ${stat.value}`)
        });
    }
}

export default Stats;
