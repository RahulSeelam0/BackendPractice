import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        typeof : Schema.Types.ObjectId, //account of the subscriber
        ref : 'User',
    },
    channel : {
        typeof : Schema.Types.ObjectId, //account of the channel owner
        ref : 'User',
    },
},{timestamps : true});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);