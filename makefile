.PHONY: run-postgre

run-postgres:
	kubectl apply -f ./k8s/postgres/postgres-secret.yml
	kubectl apply -f ./k8s/postgres/postgres-pv.yml
	kubectl apply -f ./k8s/postgres/postgres-pvc.yml
	kubectl apply -f ./k8s/postgres/postgres-deployment.yml
	kubectl apply -f ./k8s/postgres/postgres-service.yml

stop-postgres:
	kubectl delete -f ./k8s/postgres/postgres-service.yml
	kubectl delete -f ./k8s/postgres/postgres-deployment.yml
	kubectl delete -f ./k8s/postgres/postgres-pvc.yml
	kubectl delete -f ./k8s/postgres/postgres-pv.yml
	kubectl delete -f ./k8s/postgres/postgres-secret.yml