export function mountManagementFinancials({document,save,onSaved}){
  let busy=false;
  const values=form=>({managementCost:Number(form.elements.managementCost.value),discountAmount:Number(form.elements.discountAmount.value)});
  const isDirty=()=>[...document.querySelectorAll('[data-management-financials]')].some(form=>{const v=values(form);return v.managementCost!==Number(form.dataset.management)||v.discountAmount!==Number(form.dataset.discount);});
  document.addEventListener('input',event=>{
    const form=event.target.closest('[data-management-financials]');if(!form)return;
    const v=values(form),total=Number(form.dataset.total)+Number(form.dataset.discount)-v.discountAmount;
    const won=n=>Number(n).toLocaleString('ko-KR')+'원';
    form.querySelector('[data-management-total]').textContent=won(total);
    if(form.dataset.cost!==''){const cost=Number(form.dataset.cost),profit=total-cost-v.managementCost;form.querySelector('[data-management-profit]').textContent=won(profit);form.querySelector('[data-management-margin]').textContent=((cost>0?profit/cost:0)*100).toFixed(1)+'%';}
    const status=form.querySelector('[role=status]');if(status)status.textContent='저장 전';
  });
  document.addEventListener('submit',async event=>{
    const form=event.target.closest('[data-management-financials]');if(!form)return;event.preventDefault();
    if(busy||!form.reportValidity())return;
    const button=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');if(!button)return;
    busy=true;button.disabled=true;status.textContent='저장 중';
    try{const row=await save(form.dataset.estimateId,form.dataset.revision,values(form));form.dataset.management=form.elements.managementCost.value;form.dataset.discount=form.elements.discountAmount.value;await onSaved(row);}
    catch(error){status.textContent=error.message||'저장하지 못했습니다.';}
    finally{busy=false;if(button.isConnected)button.disabled=false;}
  });
  return {isDirty,isBusy:()=>busy,reset(){for(const form of document.querySelectorAll('[data-management-financials]')){form.elements.managementCost.value=form.dataset.management;form.elements.discountAmount.value=form.dataset.discount;form.elements.managementCost.dispatchEvent(new document.defaultView.Event('input',{bubbles:true}));const status=form.querySelector('[role=status]');if(status)status.textContent='';}}};
}
