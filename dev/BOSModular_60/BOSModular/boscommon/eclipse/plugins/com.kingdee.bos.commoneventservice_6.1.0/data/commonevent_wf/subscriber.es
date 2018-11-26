<?xml version="1.0" encoding="UTF-8"?>
<es:EventSubscribers xmlns:es="http://www.kingdee.com/bos/event/model/es">
 
  <es:EventSubscribePoints>    
    <es:EventSubscribePoint>
      <es:Id>79d5ddf7-0119-1000-e000-000bc0a813a5WFESBPRT</es:Id>
      <es:Name>工作流事件订阅者</es:Name>
      <es:Alias>工作流事件订阅者</es:Alias>
      <es:Description>消费工作流相关的事件</es:Description>
      <es:Group>BOS</es:Group>
      <es:Type>WF</es:Type>
      <es:Destination>vm#com.kingdee.bos.workflow.biz.event.WfEventSubscriber#Push</es:Destination>
    </es:EventSubscribePoint>  
  </es:EventSubscribePoints>       
  
  <es:EventSubscribePointRelations>  
    <es:EventSubscribePointRelation>
      <es:Id>79d5ddf7-0119-1000-e000-000fc0a813a5WFESBPRT</es:Id>
      <es:Description>订阅测试事件1</es:Description>
      <es:Type>BOS</es:Type>
      <es:RefEventId>79366a86-0119-1000-e000-0000c0a813a5WFEVPRCM</es:RefEventId>
      <es:RefEventType>BOS</es:RefEventType>
      <es:RefEventGroup></es:RefEventGroup>
      <es:RefSubscribePointId>79d5ddf7-0119-1000-e000-000bc0a813a5WFESBPRT</es:RefSubscribePointId>
      <es:RefSubscribePointType>BOS</es:RefSubscribePointType>
      <es:RefSubscribePointGroup>BOS</es:RefSubscribePointGroup>
    </es:EventSubscribePointRelation>
    <es:EventSubscribePointRelation>
      <es:Id>79d5ddf7-0119-1000-e000-000ec0a813a5WFESBPRT</es:Id>
      <es:Description>订阅测试事件2</es:Description>
      <es:Type>BOS</es:Type>
      <es:RefEventId>79366a86-0119-1000-e000-0001c0a813a5WFEVPRCM</es:RefEventId>
      <es:RefEventType>BOS</es:RefEventType>
      <es:RefEventGroup>BOS</es:RefEventGroup>
      <es:RefSubscribePointId>79d5ddf7-0119-1000-e000-000bc0a813a5WFESBPRT</es:RefSubscribePointId>
      <es:RefSubscribePointType>BOS</es:RefSubscribePointType>
      <es:RefSubscribePointGroup>BOS</es:RefSubscribePointGroup>
    </es:EventSubscribePointRelation>
     <es:EventSubscribePointRelation>
      <es:Id>79d5ddf7-0119-1000-e000-000dc0a813a5WFESBPRT</es:Id>
      <es:Description>订阅XXWebFormSubmit事件</es:Description>
      <es:Type>BOS</es:Type>
      <es:RefEventId>99996a86-9999-1000-e000-0000c0a813a5WFEVPRCM</es:RefEventId>
      <es:RefEventType>BOS</es:RefEventType>
      <es:RefEventGroup>BOS</es:RefEventGroup>
      <es:RefSubscribePointId>79d5ddf7-0119-1000-e000-000bc0a813a5WFESBPRT</es:RefSubscribePointId>
      <es:RefSubscribePointType>BOS</es:RefSubscribePointType>
      <es:RefSubscribePointGroup>BOS</es:RefSubscribePointGroup>
    </es:EventSubscribePointRelation>    
  </es:EventSubscribePointRelations>
  
</es:EventSubscribers>