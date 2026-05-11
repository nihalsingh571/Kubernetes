#!/bin/bash
# ============================================================
# InternConnect Kubernetes Lab - Full Demonstration Script
# Run this on the MASTER node during presentation
# ============================================================

echo "======================================================="
echo " STEP 1: Show Cluster Nodes"
echo "======================================================="
kubectl get nodes -o wide

echo ""
echo "======================================================="
echo " STEP 2: Show All Running Pods, Services, Deployments"
echo "======================================================="
kubectl get all -n weblab

echo ""
echo "======================================================="
echo " STEP 3: Describe ClusterIP Service (Internal Only)"
echo "======================================================="
kubectl describe service backend-svc -n weblab

echo ""
echo "======================================================="
echo " STEP 4: Describe NodePort Service (External Access)"
echo "======================================================="
kubectl describe service frontend-svc -n weblab

echo ""
echo "======================================================="
echo " STEP 5: DEMO - DNS Resolution & Internal Communication"
echo " Frontend Pod connecting to Backend using DNS name"
echo "======================================================="
FRONTEND_POD=$(kubectl get pod -n weblab -l app=frontend -o jsonpath='{.items[0].metadata.name}')
echo "Frontend Pod: $FRONTEND_POD"
echo "Calling: http://backend-svc.weblab.svc.cluster.local"
kubectl exec -n weblab $FRONTEND_POD -- curl -s http://backend-svc.weblab.svc.cluster.local | head -5
echo ""
echo "=> SUCCESS: Frontend reached Backend via ClusterIP DNS!"

echo ""
echo "======================================================="
echo " STEP 6: DEMO - Communication Failure & Troubleshooting"
echo "======================================================="
echo "Creating a broken service with no pods behind it..."
kubectl create service clusterip broken-svc --tcp=80:80 -n weblab 2>/dev/null || echo "(broken-svc already exists)"
echo ""
echo "Trying to reach broken-svc (this will FAIL)..."
kubectl exec -n weblab $FRONTEND_POD -- curl -s --max-time 3 http://broken-svc.weblab.svc.cluster.local || echo "=> FAILED: Connection timed out!"

echo ""
echo "Diagnosing WHY it failed..."
kubectl describe service broken-svc -n weblab | grep -A3 "Endpoints"
echo ""
echo "=> Root Cause: Endpoints: <none> means no pods match the service selector"

echo ""
echo "======================================================="
echo " STEP 7: Verify CoreDNS is Running (DNS Provider)"
echo "======================================================="
kubectl get pods -n kube-system -l k8s-app=kube-dns

echo ""
echo "======================================================="
echo " STEP 8: Test DNS lookup directly inside pod"
echo "======================================================="
kubectl exec -n weblab $FRONTEND_POD -- nslookup backend-svc.weblab.svc.cluster.local

echo ""
echo "======================================================="
echo " DEMONSTRATION COMPLETE"
echo " Frontend NodePort URL: http://$(kubectl get nodes -o jsonpath='{.items[1].status.addresses[0].address}'):$(kubectl get svc frontend-svc -n weblab -o jsonpath='{.spec.ports[0].nodePort}')"
echo "======================================================="
