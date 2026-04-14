import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class FilterShowData extends NavigationMixin(LightningElement) {

    @api displayData = [];

  
    handleAction(event) {
        const action = event.detail.value;
        const id = event.currentTarget.dataset.id;

        this.dispatchEvent(new CustomEvent('rowaction', {
            detail: { action, id }
        }));
    }

    handleCancel(event) {
        const id = event.target.dataset.id;

        this.dispatchEvent(new CustomEvent('cancel', {
            detail: { id }
        }));
    }

    handleSuccess(event) {
        const id = event.detail.id;

        this.dispatchEvent(new CustomEvent('savesuccess', {
            detail: { id }
        }));
    }

    
    handleError(event) {
        console.error('Save Error:', JSON.stringify(event.detail));
        alert('Error saving record');
    }

    handleNavigateToAccount(event) {
        const recordId = event.currentTarget.dataset.id;

        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Account',
                actionName: 'view'
            }
        });
    }
}