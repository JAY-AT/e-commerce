import { OrderStatusDTO } from "@common/dtos/order.dto";

const DONE_LABELS = ['Order Placed', 'Paid', 'Order Accepted', 'Shipped', 'Order Received']
const CURRENT_LABELS = {
    'Paid': 'Waiting for Payment', 
    'Order Accepted': 'Waiting for Admin Confirmation',
    'Shipped' : 'Preparing Order',
    'Order Received' : 'Out for Delivery'
}

export interface OrderTracking {
    label: string,
    status: 'pending' | 'current' | 'done',
    date?: string | null
}


// Trace point: updateObj()
function updateObj(i: number, c: number, list : OrderTracking[]) {
    while (i < c) {
                list[i].status = 'done';
                i++;
    }
    if (c >= 5) return;

    list[c].status = 'current';
    const key = list[c].label as keyof typeof CURRENT_LABELS;
    list[c].label = CURRENT_LABELS[key];
}

// Trace point: createTracker()
export function createTracker(status : OrderStatusDTO) {
    let defaultOrderTrack: OrderTracking[] = DONE_LABELS.map(name => ({
    label: name,
    status: 'pending'
    }));
    let i = 0;
    let c = 0;
    switch(status) {
            case 'pending':
                updateObj(0,1,defaultOrderTrack);
                break
            case 'paid':
                updateObj(0,2,defaultOrderTrack);
                break
            case 'accepted':
                updateObj(0,3,defaultOrderTrack);
                break
            case 'shipped':
                updateObj(0,4,defaultOrderTrack);
                break
            case 'completed':
                updateObj(0,5,defaultOrderTrack);
                defaultOrderTrack[4].status = 'done';
                break
            case 'refund':
                updateObj(0,4,defaultOrderTrack);
                defaultOrderTrack.pop();
                defaultOrderTrack.push({label: 'returned', status: 'done'})
                break
            case 'cancelled':
                const pendingVal = defaultOrderTrack[0];
                pendingVal.status = 'done';
                const cancelledVal : OrderTracking = {label: 'cancelled', status: 'done'}
                defaultOrderTrack = [pendingVal, cancelledVal];
                break
            default:
                break
        }
    return defaultOrderTrack;
}
