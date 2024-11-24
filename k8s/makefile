.PHONY: run-postgres

run-postgres:
	kubectl apply -f ./postgres/postgres-secret.yml
	kubectl apply -f ./postgres/postgres-pv.yml
	kubectl apply -f ./postgres/postgres-pvc.yml
	kubectl apply -f ./postgres/postgres-deployment.yml
	kubectl apply -f ./postgres/postgres-service.yml