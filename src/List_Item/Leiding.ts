import { Electro_Item } from "./Electro_Item";
import { htmlspecialchars } from "../general";
import { SVGelement } from "../SVGelement";

export class Leiding extends Electro_Item {
    getMaxNumChilds(): number { return 256; }

    convertLegacyKeys(mykeys: Array<[string,string,any]>) { mykeys; }

    resetProps() {
        this.clearProps();
        this.props.type = "Leiding";
        this.props.type_kabel = "XVB Cca 3G2,5";
        this.props.kabel_locatie = "N/A";
        this.props.kabel_is_in_buis = false;
        this.props.adres = "";
    }

    overrideKeys() {
        if (this.props.kabel_locatie == "Luchtleiding") this.props.kabel_is_in_buis = false;
    }

    toHTML(mode: string) {
        let output = this.toHTMLHeader(mode);
        output += "&nbsp;" + this.nrToHtml()
               + "Type: " + this.stringPropToHTML('type_kabel',10)
               + ", Plaatsing: " + this.selectPropToHTML('kabel_locatie',["N/A","Ondergronds","Luchtleiding","In wand","Op wand"]);
        if (this.props.kabel_locatie != "Luchtleiding") output += ", In buis: " + this.checkboxPropToHTML('kabel_is_in_buis');
        return output;
    }

    toSVG() {
        this.overrideKeys();
        // Children continue above this cable segment in the vertical schema.
        const mySVG: SVGelement = this.sourcelist.toSVG(this.id, "vertical");
        const cableHeight = 100;
        const x = mySVG.xleft;
        const y = mySVG.yup;

        mySVG.data += '<line x1="' + x + '" x2="' + x + '" y1="' + y + '" y2="' + (y + cableHeight) + '" stroke="black" />';
        if (this.props.kabel_locatie === "Luchtleiding") {
            mySVG.data += '<circle cx="' + x + '" cy="' + (y + 20) + '" r="4" style="stroke:black;fill:none" />';
        }
        if (this.props.kabel_is_in_buis && this.props.kabel_locatie !== "Luchtleiding") {
            mySVG.data += '<circle cx="' + (x - 10) + '" cy="' + (y + 40) + '" r="4" style="stroke:black;fill:none" />';
        }
        mySVG.data += '<text x="' + (x + 15) + '" y="' + (y + 80) + '" transform="rotate(-90 ' + (x + 15) + ',' + (y + 80) + ')" style="text-anchor:start" font-family="Arial, Helvetica, sans-serif" font-size="10">'
                    + htmlspecialchars(this.props.type_kabel) + '</text>';
        mySVG.yup += cableHeight;
        mySVG.xright = Math.max(mySVG.xright, 25);
        return mySVG;
    }
}
