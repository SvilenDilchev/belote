import React, { Component } from "react";

class BidBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isActive: props.isActive,
            validBids: props.validBids,
            partner: props.partner,
            tempBidder: props.tempBidder
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.isActive !== this.props.isActive || prevProps.tempBidder !== this.props.tempBidder) {
            this.setState({
                isActive: this.props.isActive,
                validBids: this.props.validBids,
                partner: this.props.partner,
                tempBidder: this.props.tempBidder
            });
        }
    }

    render() {
        const canDouble = this.state.tempBidder && this.state.tempBidder.socketID !== this.state.partner.socketID

        return (
            <div>
                <div className={`BidBox ${this.state.isActive ? "active" : ""}`}>
                    <div id="BidBoxHeader">Please Bid</div>
                    <div id="BidBoxHR"></div>
                    <div className="BidBoxRow">
                        <div className={`BidField LeftField ${this.state.validBids.includes("Clubs") ? "active" : ""}`} id="bidField" onClick={this.state.validBids.includes("Clubs") && this.state.isActive ? () => this.props.sendBid("Clubs") : undefined}>
                            Clubs
                        </div>
                        <div className={`BidField RightField ${this.state.validBids.includes("Diamonds") ? "active" : ""}`} id="bidField" onClick={this.state.validBids.includes("Diamonds") && this.state.isActive ? () => this.props.sendBid("Diamonds") : undefined}>
                            Diamonds
                        </div>
                    </div>
                    <div className="BidBoxRow">
                        <div className={`BidField LeftField ${this.state.validBids.includes("Hearts") ? "active" : ""}`} id="bidField" onClick={this.state.validBids.includes("Hearts") && this.state.isActive ? () => this.props.sendBid("Hearts") : undefined}>
                            Hearts
                        </div>
                        <div className={`BidField RightField ${this.state.validBids.includes("Spades") ? "active" : ""}`} id="bidField" onClick={this.state.validBids.includes("Spades") && this.state.isActive ? () => this.props.sendBid("Spades") : undefined}>
                            Spades
                        </div>
                    </div>
                    <div className="BidBoxRow">
                        <div className={`BidField LeftField ${this.state.validBids.includes("No Trumps") ? "active" : ""}`} id="bidField" onClick={this.state.validBids.includes("No Trumps") && this.state.isActive ? () => this.props.sendBid("No Trumps") : undefined}>
                            No Trumps
                        </div>
                        <div className={`BidField RightField ${this.state.validBids.includes("All Trumps") ? "active" : ""}`} id="bidField" onClick={this.state.validBids.includes("All Trumps") && this.state.isActive ? () => this.props.sendBid("All Trumps") : undefined}>
                            All Trumps
                        </div>
                    </div>
                    <div className="BidBoxRow">
                        <div className={`BidField LeftField active`} id="bidField" onClick={() => this.props.sendBid("Pass")}>
                            Pass
                        </div>
                        <div className={`BidField RightField ${(this.state.validBids.includes("Double") || this.state.validBids.includes("Redouble")) && canDouble ? "active" : ""}`} id="bidField"
                            onClick={(this.state.validBids.includes("Double") || this.state.validBids.includes("Redouble")) && this.state.isActive && canDouble ? () => this.props.sendBid(this.state.validBids.includes("Redouble") ? "Redouble" : "Double") : undefined}>
                            {this.state.validBids.includes("Redouble") ? "Redouble" : "Double"}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default BidBox;
